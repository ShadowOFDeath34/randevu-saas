import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceSchema } from '@/lib/validations'

export async function PUT(
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
    const validatedData = serviceSchema.parse(body)

    const existingService = await db.service.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    const service = await db.service.update({
      where: { id },
      data: validatedData
    })

    return NextResponse.json(service)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error updating service:', error)
    return NextResponse.json({ error: 'Error updating service' }, { status: 500 })
  }
}

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
    
    const existingService = await db.service.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 })
    }

    // Check if service has active bookings
    const activeBookings = await db.booking.findFirst({
      where: {
        serviceId: id,
        tenantId: session.user.tenantId,
        status: { notIn: ['cancelled', 'completed'] }
      }
    })

    if (activeBookings) {
      return NextResponse.json(
        { error: 'Bu hizmete ait henüz tamamlanmamış aktif randevular var. Silinemez.' },
        { status: 400 }
      )
    }

    await db.service.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting service:', error)
    return NextResponse.json({ error: 'Error deleting service' }, { status: 500 })
  }
}
