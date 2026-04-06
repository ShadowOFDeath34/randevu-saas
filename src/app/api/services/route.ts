import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { serviceSchema } from '@/lib/validations'
import { ZodError } from 'zod'

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
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      console.error('Service validation errors:', error.issues)
      const firstError = error.issues[0]
      return NextResponse.json(
        { error: firstError?.message || 'Geçersiz veri', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error creating service:', error)
    return NextResponse.json({ error: 'Error creating service' }, { status: 500 })
  }
}
