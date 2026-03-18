import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const search = searchParams.get('search') || ''

    // Validate pagination params
    const validatedPage = Math.max(1, page)
    const validatedLimit = Math.min(100, Math.max(1, limit)) // Max 100 items per page
    const skip = (validatedPage - 1) * validatedLimit

    // Build where clause with optional search
    const where: Prisma.CustomerWhereInput = { tenantId: session.user.tenantId }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Run count and fetch in parallel for better performance
    const [customers, totalCount] = await Promise.all([
      db.customer.findMany({
        where,
        select: {
          id: true,
          fullName: true,
          phone: true,
          email: true,
          notes: true,
          noShowCount: true,
          totalBookings: true,
          lastVisitDate: true,
          customerSegment: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { bookings: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: validatedLimit,
      }),
      db.customer.count({ where })
    ])

    return NextResponse.json({
      data: customers,
      pagination: {
        page: validatedPage,
        limit: validatedLimit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / validatedLimit),
      }
    })
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
