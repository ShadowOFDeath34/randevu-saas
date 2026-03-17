import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { BookingStatus } from '@prisma/client'
import { sendSMS } from '@/lib/sms'
import { sendBookingStatusEmail } from '@/lib/email'

// GET - Tekil booking getir
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const booking = await db.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: null
      },
      include: {
        customer: true,
        service: true,
        staff: true,
        statusLogs: {
          orderBy: { changedAt: 'desc' },
          take: 10
        }
      }
    })

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error fetching booking:', error)
    return NextResponse.json({ error: 'Error fetching booking' }, { status: 500 })
  }
}

// PATCH - Booking güncelle (status)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { status } = body

    const existingBooking = await db.booking.findFirst({
      where: { id, tenantId: session.user.tenantId, deletedAt: null }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    const booking = await db.booking.update({
      where: { id },
      data: { status }
    })

    await db.bookingStatusLog.create({
      data: {
        tenantId: session.user.tenantId,
        bookingId: id,
        oldStatus: existingBooking.status as BookingStatus,
        newStatus: status as BookingStatus,
        changedByUserId: session.user.id
      }
    })

    // Müşteriye durum güncellemesi bildirimi (async, blocking değil)
    const customer = await db.customer.findUnique({
      where: { id: existingBooking.customerId }
    })

    if (customer?.phone && ['confirmed', 'cancelled'].includes(status)) {
      const message = status === 'confirmed'
        ? `Merhaba ${customer.fullName}, ${existingBooking.bookingDate} ${existingBooking.startTime} tarihli randevunuz onaylandi. Bizi tercih ettiginiz icin tesekkurler!`
        : `Merhaba ${customer.fullName}, ${existingBooking.bookingDate} ${existingBooking.startTime} tarihli randevunuz iptal edildi. Daha fazla bilgi icin bizi arayabilirsiniz.`

      sendSMS({
        phone: customer.phone,
        message,
        tenantId: session.user.tenantId,
        bookingId: id
      }).catch(err => console.error('Status SMS sending failed:', err))
    }

    if (customer?.email && ['confirmed', 'cancelled'].includes(status)) {
      sendBookingStatusEmail(customer.email, {
        customerName: customer.fullName,
        status: status as BookingStatus,
        bookingDate: existingBooking.bookingDate,
        bookingTime: existingBooking.startTime
      }).catch(err => console.error('Status email sending failed:', err))
    }

    return NextResponse.json(booking)
  } catch (error) {
    console.error('Error updating booking:', error)
    return NextResponse.json({ error: 'Error updating booking' }, { status: 500 })
  }
}

// DELETE - Booking soft delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingBooking = await db.booking.findFirst({
      where: { id, tenantId: session.user.tenantId, deletedAt: null }
    })

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    // Sadece pending veya cancelled booking'ler silinebilir
    const allowedStatusesForDelete: BookingStatus[] = [BookingStatus.pending, BookingStatus.cancelled]
    if (!allowedStatusesForDelete.includes(existingBooking.status)) {
      return NextResponse.json(
        { error: 'Sadece bekleyen veya iptal edilmiş randevular silinebilir' },
        { status: 400 }
      )
    }

    // Soft delete
    const booking = await db.booking.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'BOOKING_SOFT_DELETE',
        entityType: 'Booking',
        entityId: id,
        metadataJson: JSON.stringify({
          bookingDate: existingBooking.bookingDate,
          startTime: existingBooking.startTime,
          status: existingBooking.status
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Randevu başarıyla silindi',
      booking
    })
  } catch (error) {
    console.error('Error deleting booking:', error)
    return NextResponse.json({ error: 'Error deleting booking' }, { status: 500 })
  }
}
