import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { fullName, phone, email } = body

    if (!fullName || !phone) {
      return NextResponse.json({ error: 'Ad ve telefon gereklidir' }, { status: 400 })
    }

    const cleanPhone = phone.replace(/\D/g, '')

    const existingCustomer = await db.customer.findFirst({
      where: { 
        tenantId: session.user.tenantId,
        phone: { contains: cleanPhone.slice(-10) }
      }
    })

    if (existingCustomer) {
      return NextResponse.json({ error: 'Müşteri zaten mevcut', existing: true }, { status: 400 })
    }

    const customer = await db.customer.create({
      data: {
        tenantId: session.user.tenantId,
        fullName,
        phone: cleanPhone,
        email: email || null
      }
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error('Error importing customer:', error)
    return NextResponse.json({ error: 'Error importing customer' }, { status: 500 })
  }
}
