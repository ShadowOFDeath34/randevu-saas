import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma, BookingStatus } from '@prisma/client'
import { sendSMS } from '@/lib/sms'
import { sendBookingConfirmationEmail } from '@/lib/email'
import { smsTemplateService } from '@/lib/sms/template-service'
import { addPoints, getOrCreateLoyaltyConfig } from '@/lib/loyalty/service'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const filter = searchParams.get('filter') || 'all'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Validate pagination params
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(100, Math.max(1, limit)) // Max 100 items per page
    const skip = (validatedPage - 1) * validatedLimit

    const where: Prisma.BookingWhereInput = { tenantId: session.user.tenantId }

    if (filter !== 'all') {
      where.status = filter as BookingStatus
    }

    // Run count and fetch in parallel for better performance
    const [bookings, totalCount] = await Promise.all([
      db.booking.findMany({
        where,
        select: {
          id: true,
          bookingDate: true,
          startTime: true,
          endTime: true,
          status: true,
          notes: true,
          confirmationCode: true,
          createdAt: true,
          customer: {
            select: {
              id: true,
              fullName: true,
              phone: true,
              email: true,
            }
          },
          service: {
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              price: true,
            }
          },
          staff: {
            select: {
              id: true,
              fullName: true,
              avatarUrl: true,
            }
          }
        },
        orderBy: [{ bookingDate: 'desc' }, { startTime: 'desc' }],
        skip,
        take: validatedLimit,
      }),
      db.booking.count({ where })
    ])

    return NextResponse.json({
      data: bookings,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / validatedLimit),
      }
    })
  } catch (error) {
    console.error('Error fetching bookings:', error)
    return NextResponse.json({ error: 'Error fetching bookings' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { customerId, customerName, customerPhone, customerEmail, customerNotes, serviceId, staffId, bookingDate, startTime, notes } = body

    const service = await db.service.findFirst({
      where: { id: serviceId, tenantId: session.user.tenantId }
    })

    if (!service) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const staff = await db.service.findFirst({
      where: { id: staffId, tenantId: session.user.tenantId }
    })

    if (!staff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1])
    const endMinutes = startMinutes + service.durationMinutes
    const endTime = `${Math.floor(endMinutes / 60).toString().padStart(2, '0')}:${(endMinutes % 60).toString().padStart(2, '0')}`

    const bookingDateTime = new Date(`${bookingDate}T${startTime}:00`)
    if (bookingDateTime < new Date()) {
      return NextResponse.json({ error: 'Geçmiş tarihe randevu alınamaz' }, { status: 400 })
    }

    const booking = await db.$transaction(async (tx) => {
      const existingBooking = await tx.booking.findFirst({
      where: {
        tenantId: session.user.tenantId,
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

      let customer = null
      if (customerId) {
        customer = await tx.customer.findFirst({
          where: { id: customerId, tenantId: session.user.tenantId }
        })
      }

      if (!customer && customerPhone) {
        customer = await tx.customer.findFirst({
          where: { tenantId: session.user.tenantId, phone: customerPhone }
        })

        if (!customer) {
          customer = await tx.customer.create({
            data: {
              tenantId: session.user.tenantId,
              fullName: customerName,
              phone: customerPhone,
              email: customerEmail || null,
              notes: customerNotes || null
            }
          })
        }
      }

      const newBooking = await tx.booking.create({
        data: {
          tenantId: session.user.tenantId,
          customerId: customer?.id || customerId,
          serviceId,
          staffId,
          bookingDate,
          startTime,
          endTime,
          notes: notes || null,
          status: 'pending'
        },
        include: {
          service: true,
          customer: true,
          staff: true,
          tenant: true
        }
      })

      return newBooking
    }, {
      maxWait: 5000,
      timeout: 10000,
      isolationLevel: 'Serializable'
    })

    // Bildirim gönder (async, blocking değil)
    if (booking.customer?.phone) {
      const confirmationMessage = await smsTemplateService.formatBookingConfirmation(
        session.user.tenantId,
        {
          customerName: booking.customer.fullName,
          serviceName: booking.service.name,
          date: booking.bookingDate,
          time: booking.startTime,
          confirmationCode: booking.id.slice(-6).toUpperCase(),
          staffName: booking.staff?.fullName || '',
          businessName: booking.tenant?.name || 'RandevuAI',
        }
      )

      sendSMS({
        phone: booking.customer.phone,
        message: confirmationMessage || `Merhaba ${booking.customer.fullName}, ${booking.service.name} randevunuz ${booking.bookingDate} ${booking.startTime} icin alindi. Onay kodunuz: ${booking.id.slice(-6).toUpperCase()}`,
        tenantId: session.user.tenantId,
        bookingId: booking.id
      }).catch(err => console.error('SMS sending failed:', err))
    }

    if (booking.customer?.email) {
      sendBookingConfirmationEmail(booking.customer.email, {
        customerName: booking.customer.fullName,
        serviceName: booking.service.name,
        staffName: booking.staff.fullName,
        date: booking.bookingDate,
        time: booking.startTime,
        businessName: booking.tenant?.name || 'RandevuAI',
        confirmationCode: booking.id.slice(-6).toUpperCase()
      }).catch(err => console.error('Email sending failed:', err))
    }

    // Loyalty puan ekle (async, blocking değil)
    if (booking.customerId) {
      try {
        const config = await getOrCreateLoyaltyConfig(session.user.tenantId)
        await addPoints(
          session.user.tenantId,
          booking.customerId,
          config.pointsPerBooking,
          'EARNED_BOOKING',
          `Randevu oluşturuldu: ${booking.service.name}`,
          booking.id
        )
      } catch (err) {
        console.error('Loyalty points error:', err)
        // Loyalty hatası booking'i etkilemesin
      }
    }

    return NextResponse.json(booking)
  } catch (error: unknown) {
    console.error('Error creating booking:', error)
    const err = error as Error
    if (err.message === 'BU_SAAT_DOLU') {
      return NextResponse.json({ error: 'Bu saat dilimi maalesef az önce doldu.' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Error creating booking' }, { status: 500 })
  }
}
