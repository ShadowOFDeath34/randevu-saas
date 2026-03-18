import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { staffSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const staff = await db.staff.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        services: true
      },
      orderBy: { fullName: 'asc' }
    })

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error fetching staff:', error)
    return NextResponse.json({ error: 'Error fetching staff' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { serviceIds, ...staffData } = body
    const validatedData = staffSchema.parse(staffData)

    const staff = await db.staff.create({
      data: {
        ...validatedData,
        tenantId: session.user.tenantId,
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
    console.error('Error creating staff:', error)
    return NextResponse.json({ error: 'Error creating staff' }, { status: 500 })
  }
}
