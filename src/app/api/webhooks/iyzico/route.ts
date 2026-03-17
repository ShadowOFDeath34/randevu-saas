import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
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

/**
 * IP whitelist kontrolu (iyzico IP'leri)
 */
function isAllowedIP(ip: string): boolean {
  // iyzico webhook IP'leri (guncel listeyi iyzico dokumantasyonundan alin)
  const allowedIPs = [
    '185.29.92.0/22', // Ornek IP range
    // Gercek IP'ler eklenecek
  ]
  
  // IP kontrolu implementasyonu
  // Not: Vercel'de req.ip dogrudan gelmez, X-Forwarded-For header'i kullanilir
  return true // Gecici olarak devre disi
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
    let body: any
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

    const { status, paymentId, conversationId, mdStatus, iyziStatus } = body

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
      // Transaction ile guncelleme
      const result = await db.$transaction(async (tx) => {
        const booking = await tx.booking.findFirst({
          where: {
            OR: [
              { id: conversationId },
              { confirmationCode: conversationId }
            ]
          }
        })

        if (!booking) {
          console.error('Webhook: Booking bulunamadi', { conversationId: conversationId.substring(0, 10) + '...' })
          return null
        }
        
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
            status: 'confirmed' // Odemesi alindiysa onaylandi olarak isaretle
          }
        })
        
        // Audit log
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
      
      if (result) {
        console.log('Webhook: Odeme basariyla islendi', { bookingId: result.id })
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
