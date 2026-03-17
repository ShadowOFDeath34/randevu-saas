import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Sadece admin veya owner yetkisi
    if (!['owner', 'admin', 'super_admin'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existingBooking = await db.booking.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId,
        deletedAt: { not: null }
      }
    })

    if (!existingBooking) {
      return NextResponse.json(
        { error: 'Silinmiş randevu bulunamadı' },
        { status: 404 }
      )
    }

    // Restore
    const booking = await db.booking.update({
      where: { id },
      data: { deletedAt: null }
    })

    // Audit log
    await db.auditLog.create({
      data: {
        tenantId: session.user.tenantId,
        actorUserId: session.user.id,
        action: 'BOOKING_RESTORE',
        entityType: 'Booking',
        entityId: id,
        metadataJson: JSON.stringify({
          bookingDate: existingBooking.bookingDate,
          startTime: existingBooking.startTime
        })
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Randevu başarıyla geri yüklendi',
      booking
    })
  } catch (error) {
    console.error('Error restoring booking:', error)
    return NextResponse.json({ error: 'Error restoring booking' }, { status: 500 })
  }
}
