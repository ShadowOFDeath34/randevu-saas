import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendInvoiceEmail } from '@/lib/email'
import crypto from 'crypto'

/**
 * iyzico webhook signature validasyonu
 * iyzico secret key kullanarak signature dogrulama
 */
function verifyWebhookSignature(
  payload: string,
  signature: string,
  secretKey: string
): boolean {
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(payload)
      .digest('hex')
    
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    )
  } catch {
    return false
  }
}

export async function POST(req: Request) {
  try {
    // 1. IP kontrolu (opsiyonel ama onerilir)
    // const clientIP = req.headers.get('x-forwarded-for') || 'unknown'
    
    // 2. Signature kontrolu
    const signature = req.headers.get('x-iyzico-signature') || 
                     req.headers.get('iyzico-signature') ||
                     req.headers.get('x-signature')
    
    if (!signature) {
      console.error('Webhook: Signature header eksik')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // 3. Body'yi raw olarak al (signature dogrulama icin)
    const rawBody = await req.text()
    
    // 4. Signature dogrulama
    const secretKey = process.env.IYZIPAY_SECRET_KEY
    if (!secretKey) {
      console.error('Webhook: IYZIPAY_SECRET_KEY tanimlanmamis')
      return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
    
    if (!verifyWebhookSignature(rawBody, signature, secretKey)) {
      console.error('Webhook: Gecersiz signature', { signature: signature.substring(0, 20) + '...' })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    
    // 5. Body'yi parse et
    let body: Record<string, unknown>
    const contentType = req.headers.get('content-type') || ''
    
    try {
      if (contentType.includes('application/json')) {
        body = JSON.parse(rawBody)
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        const params = new URLSearchParams(rawBody)
        body = Object.fromEntries(params)
      } else {
        // FormData olarak dene
        const formData = await req.formData()
        body = Object.fromEntries(formData)
      }
    } catch (parseError) {
      console.error('Webhook: Body parse hatasi', parseError)
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }

    const { status, paymentId, conversationId, mdStatus, iyziStatus } = body as {
      status?: string
      paymentId?: string
      conversationId?: string
      mdStatus?: string
      iyziStatus?: string
    }

    // 6. conversationId kontrolu
    if (!conversationId) {
      console.error('Webhook: conversationId eksik')
      return NextResponse.json({ error: 'conversationId eksik' }, { status: 400 })
    }
    
    // 7. Log webhook (guvenlik ve debug icin)
    console.log('Webhook received:', {
      conversationId: conversationId.substring(0, 10) + '...',
      status,
      paymentId: paymentId?.substring(0, 10) + '...',
      timestamp: new Date().toISOString()
    })

    // 8. Basarili odeme senaryosu
    const isSuccess = status === 'success' || mdStatus === '1' || iyziStatus === 'success'

    if (isSuccess) {
      // Once booking odemesi mi kontrol et
      const bookingResult = await db.$transaction(async (tx) => {
        const booking = await tx.booking.findFirst({
          where: {
            OR: [
              { id: conversationId },
              { confirmationCode: conversationId }
            ]
          }
        })

        if (!booking) return null

        // Zaten odenmisse tekrar isleme
        if (booking.paymentStatus === 'paid') {
          console.log('Webhook: Booking zaten odenmis', { bookingId: booking.id })
          return booking
        }

        const updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: {
            paymentStatus: 'paid',
            paymentReference: paymentId || null,
            status: 'confirmed'
          }
        })

        await tx.auditLog.create({
          data: {
            tenantId: booking.tenantId,
            action: 'payment_received',
            entityType: 'Booking',
            entityId: booking.id,
            metadataJson: JSON.stringify({
              paymentId,
              amount: body.paidPrice,
              currency: body.currency
            })
          }
        })

        return updatedBooking
      })

      if (bookingResult) {
        console.log('Webhook: Booking odemesi basariyla islendi', { bookingId: bookingResult.id })
      } else {
        // Booking bulunamadiysa subscription odemesi olabilir
        const subscriptionResult = await db.$transaction(async (tx) => {
          // conversationId formati: {tenantId}_{timestamp}
          const tenantId = conversationId.split('_')[0]
          if (!tenantId) return null

          // Subscription'i bul
          const subscription = await tx.subscription.findFirst({
            where: { tenantId },
            include: { plan: true, tenant: { include: { businessProfile: true } } }
          })

          if (!subscription) return null

          // Abonelik bitis tarihini hesapla
          const now = new Date()
          const endDate = subscription.plan.billingPeriod === 'yıllık'
            ? new Date(now.setFullYear(now.getFullYear() + 1))
            : new Date(now.setMonth(now.getMonth() + 1))

          // Subscription'i guncelle
          const updatedSubscription = await tx.subscription.update({
            where: { id: subscription.id },
            data: {
              status: 'active',
              endDate,
              iyzicoPaymentId: paymentId || undefined,
              iyzicoConversationId: conversationId
            }
          })

          // Fatura olustur
          const invoice = await tx.invoice.create({
            data: {
              tenantId,
              subscriptionId: subscription.id,
              amount: subscription.plan.price,
              currency: 'TRY',
              status: 'paid',
              dueDate: new Date(),
              paidAt: new Date(),
              invoiceNumber: `INV-${Date.now()}`,
              description: `${subscription.plan.name} - ${subscription.plan.billingPeriod}`,
              iyzicoPaymentId: paymentId || undefined
            }
          })

          return { subscription: updatedSubscription, invoice, tenant: subscription.tenant, plan: subscription.plan }
        })

        if (subscriptionResult) {
          console.log('Webhook: Subscription odemesi basariyla islendi', { subscriptionId: subscriptionResult.subscription.id })

          // Fatura email'i gonder
          const owner = await db.user.findFirst({
            where: { tenantId: subscriptionResult.tenant.id, role: 'owner' }
          })

          if (owner?.email) {
            await sendInvoiceEmail(owner.email, {
              customerName: owner.name || 'Değerli Müşteri',
              invoiceNumber: subscriptionResult.invoice.invoiceNumber,
              amount: subscriptionResult.invoice.amount,
              currency: subscriptionResult.invoice.currency,
              planName: subscriptionResult.plan.name,
              billingPeriod: subscriptionResult.plan.billingPeriod,
              invoiceDate: new Date().toLocaleDateString('tr-TR'),
              businessName: subscriptionResult.tenant.businessProfile?.businessName || 'RandevuAI'
            }, subscriptionResult.tenant.id, owner.id).catch(err => {
              console.error('Fatura email gonderme hatasi:', err)
            })
          }
        } else {
          console.error('Webhook: Ne booking ne de subscription bulunamadi', { conversationId: conversationId.substring(0, 10) + '...' })
        }
      }
    } else {
      // Basarisiz odeme
      console.log('Webhook: Basarisiz odeme', {
        conversationId: conversationId.substring(0, 10) + '...',
        status,
        errorMessage: body.errorMessage
      })
    }

    // iyzico'ya basarili 200 donmek zorundayiz ki tekrar tekrar webhook atmasin
    return NextResponse.json({ status: 'success', received: true })
  } catch (error) {
    console.error('Iyzico webhook error:', error)
    return NextResponse.json({ error: 'Webhook islenemedi' }, { status: 500 })
  }
}
