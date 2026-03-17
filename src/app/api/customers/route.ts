import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const customers = await db.customer.findMany({
      where: { tenantId: session.user.tenantId },
      include: {
        _count: { select: { bookings: true } }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error('Error fetching customers:', error)
    return NextResponse.json({ error: 'Error fetching customers' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fullName, phone, email, notes } = body

    const existingCustomer = await db.customer.findFirst({
      where: { tenantId: session.user.tenantId, phone }
    })

    if (existingCustomer) {
      return NextResponse.json({ error: 'Bu telefon numarası ile kayıtlı müşteri var' }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        tenantId: session.user.tenantId,
        fullName,
        phone,
        email: email || null,
        notes: notes || null
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error creating customer:', error)
    return NextResponse.json({ error: 'Error creating customer' }, { status: 500 })
  }
}
