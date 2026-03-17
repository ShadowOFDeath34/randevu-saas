import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { generateConfirmationCode } from '@/lib/utils'
import { checkIPRateLimit, defaultConfigs, createRateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: Request) {
  // Rate limiting: 10 requests per minute per IP
  const rateLimit = await checkIPRateLimit(req, defaultConfigs.public)
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit)
  }
  try {
    const body = await req.json()
    const { slug, customerName, customerPhone, customerEmail, customerNotes, serviceId, staffId, bookingDate, startTime } = body

    if (!slug || !customerName || !customerPhone || !serviceId || !staffId || !bookingDate || !startTime) {
      return NextResponse.json({ error: 'Eksik bilgi' }, { status: 400 })
    }

    const tenant = await db.tenant.findUnique({
      where: { slug }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'İşletme bulunamadı' }, { status: 404 })
    }

    const service = await db.service.findFirst({
      where: { id: serviceId, tenantId: tenant.id }
    })

    if (!service) {
      return NextResponse.json({ error: 'Hizmet bulunamadı' }, { status: 404 })
    }

    const staff = await db.staff.findFirst({
      where: { id: staffId, tenantId: tenant.id }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Personel bulunamadı' }, { status: 404 })
    }

    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const endMinutes = startMinutes + service.durationMinutes
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

    const bookingDateTime = new Date(`${bookingDate}T${startTime}:00`)
    if (bookingDateTime < new Date()) {
      return NextResponse.json({ error: 'Geçmiş tarihe randevu alınamaz' }, { status: 400 })
    }

    const result = await db.$transaction(async (tx) => {
      const existingBooking = await tx.booking.findFirst({
      where: {
        tenantId: tenant.id,
        staffId,
        bookingDate,
        status: { notIn: ['cancelled'] },
        OR: [
          { startTime: { lte: startTime }, endTime: { gt: startTime } },
          { startTime: { lt: endTime }, endTime: { gte: endTime } },
          { startTime: { gte: startTime }, endTime: { lte: endTime } }
        ]
      }
    })

      if (existingBooking) {
        throw new Error('BU_SAAT_DOLU')
      }

      let customer = await tx.customer.findFirst({
        where: { tenantId: tenant.id, phone: customerPhone }
      })

      if (!customer) {
        customer = await tx.customer.create({
          data: {
            tenantId: tenant.id,
            fullName: customerName,
            phone: customerPhone,
            email: customerEmail || null,
            notes: customerNotes || null
          }
        })
      }

      const confirmationCode = await generateConfirmationCode()

      const newBooking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          customerId: customer.id,
          serviceId,
          staffId,
          bookingDate,
          startTime,
          endTime,
          notes: customerNotes || null,
          confirmationCode,
          status: 'pending',
          source: 'public'
        },
        include: {
          service: true,
          customer: true,
          staff: true
        }
      })

      return { booking: newBooking, confirmationCode: newBooking.confirmationCode }
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    })

    return NextResponse.json({
      ...result.booking,
      confirmationCode: result.confirmationCode
    })
  } catch (error: any) {
    console.error('Error creating public booking:', error)
    if (error.message === 'BU_SAAT_DOLU') {
      return NextResponse.json({ error: 'Bu saat dilimi maalesef az önce doldu, lütfen başka bir saat seçin.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Randevu oluşturma hatası' }, { status: 500 })
  }
}
