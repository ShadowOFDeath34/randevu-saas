import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceSchema } from '@/lib/validations'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const services = await db.service.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(services)
  } catch (error) {
    console.error('Error fetching services:', error)
    return NextResponse.json({ error: 'Error fetching services' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = serviceSchema.parse(body)

    const service = await db.service.create({
      data: {
        ...validatedData,
        tenantId: session.user.tenantId
      }
    })

    return NextResponse.json(service)
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 })
    }
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Error creating service' }, { status: 500 })
  }
}
