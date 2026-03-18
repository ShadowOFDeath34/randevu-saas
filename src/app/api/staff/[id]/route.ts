import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { staffSchema } from '@/lib/validations'

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
    const { serviceIds, ...staffData } = body
    const validatedData = staffSchema.parse(staffData)

    const existingStaff = await db.staff.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    await db.staffService.deleteMany({ where: { staffId: id } })

    const staff = await db.staff.update({
      where: { id },
      data: {
        ...validatedData,
        services: serviceIds?.length ? {
          create: serviceIds.map((serviceId: string) => ({
            serviceId,
            tenantId: session.user.tenantId
          }))
        } : undefined
      },
      include: { services: true }
    })

    return NextResponse.json(staff)
  } catch (error: unknown) {
    if (error instanceof Error && error.name === 'ZodError') {
      const zodError = error as unknown as { errors: { message: string }[] }
      return NextResponse.json({ error: zodError.errors[0].message }, { status: 400 })
    }
    console.error('Error updating staff:', error)
    return NextResponse.json({ error: 'Error updating staff' }, { status: 500 })
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
    
    const existingStaff = await db.staff.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingStaff) {
      return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
    }

    // Check if staff has active bookings
    const activeBookings = await db.booking.findFirst({
      where: {
        staffId: id,
        tenantId: session.user.tenantId,
        status: { notIn: ['cancelled', 'completed'] }
      }
    })

    if (activeBookings) {
      return NextResponse.json(
        { error: 'Bu personelin henüz tamamlanmamış aktif randevuları var. Silinemez.' },
        { status: 400 }
      )
    }

    await db.staff.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting staff:', error)
    return NextResponse.json({ error: 'Error deleting staff' }, { status: 500 })
  }
}
