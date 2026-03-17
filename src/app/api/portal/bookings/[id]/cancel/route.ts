import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import { BookingStatus } from '@prisma/client'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { phone } = body

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    const customer = await db.customer.findFirst({
      where: { phone }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    const booking = await db.booking.findFirst({
      where: {
        id,
        customerId: customer.id,
        deletedAt: null,
      },
      include: {
        service: true,
        tenant: true,
      },
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    if (!['pending', 'confirmed'].includes(booking.status)) {
      return NextResponse.json(
        { error: 'Only pending or confirmed bookings can be cancelled' },
        { status: 400 }
      )
    }

    const updatedBooking = await db.booking.update({
      where: { id },
      data: { status: 'cancelled' },
    })

    await db.bookingStatusLog.create({
      data: {
        tenantId: booking.tenantId,
        bookingId: id,
        oldStatus: booking.status as BookingStatus,
        newStatus: 'cancelled',
        changedAt: new Date(),
      },
    })

    if (customer.phone) {
      sendSMS({
        phone: customer.phone,
        message: `Merhaba ${customer.fullName}, ${booking.service.name} randevunuz iptal edildi.`,
        tenantId: booking.tenantId,
        bookingId: id,
      }).catch(err => console.error('Cancel SMS failed:', err))
    }

    return NextResponse.json({
      success: true,
      message: 'Booking cancelled successfully',
      booking: updatedBooking,
    })
  } catch (error) {
    console.error('Portal booking cancel error:', error)
    return NextResponse.json({ error: 'Failed to cancel booking' }, { status: 500 })
  }
}
