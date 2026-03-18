import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'

export async function POST(req: Request) {
  try {
    const { phone, slug } = await req.json()

    if (!phone || !slug) {
      return NextResponse.json({ error: 'Telefon numarası ve işletme bilgisi gereklidir.' }, { status: 400 })
    }

    const business = await db.businessProfile.findUnique({
      where: { bookingSlug: slug }
    })

    if (!business) {
      return NextResponse.json({ error: 'İşletme bulunamadı.' }, { status: 404 })
    }

    const today = new Date().toISOString().split('T')[0]

    // Find if customer exists for this tenant
    const customer = await db.customer.findUnique({
      where: { tenantId_phone: { tenantId: business.tenantId, phone } }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Bu telefon numarasına ait müşteri kaydı bulunamadı.' }, { status: 404 })
    }

    // Find their pending or confirmed booking for today
    const booking = await db.booking.findFirst({
      where: {
        tenantId: business.tenantId,
        customerId: customer.id,
        bookingDate: today,
        status: { in: ['pending', 'confirmed'] }
      },
      orderBy: { startTime: 'asc' }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Bugün için bekleyen bir randevunuz bulunmamaktadır.' }, { status: 404 })
    }

    // Update to confirmed (customer arrived)
    await db.$transaction([
      db.booking.update({
        where: { id: booking.id },
        data: { status: 'confirmed' }
      }),
      db.bookingStatusLog.create({
        data: {
          tenantId: business.tenantId,
          bookingId: booking.id,
          oldStatus: booking.status,
          newStatus: 'confirmed'
        }
      })
    ])

    // Send SMS notification to customer
    if (customer.phone) {
      sendSMS({
        phone: customer.phone,
        message: `Merhaba ${customer.fullName}, ${business.businessName} girisiniz kaydedildi. Siraniz alindi, kisa surede hizmet verilecektir.`,
        tenantId: business.tenantId,
        bookingId: booking.id
      }).catch(err => console.error('Kiosk SMS error:', err))
    }

    return NextResponse.json({
      success: true,
      message: `Hoş geldiniz, ${customer.fullName}! İşleminizi onayladık, lütfen bekleme salonuna geçiniz.`
    })
  } catch (error: unknown) {
    console.error('Kiosk check-in error:', error)
    return NextResponse.json({ error: 'Bir hata oluştu, lütfen personele başvurun.' }, { status: 500 })
  }
}
