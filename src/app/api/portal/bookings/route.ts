import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXTAUTH_SECRET || ''
)

async function verifyPortalToken(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return null
  }

  const token = authHeader.slice(7)
  if (!token) {
    return null
  }

  try {
    if (!process.env.NEXTAUTH_SECRET) {
      console.error('NEXTAUTH_SECRET not configured')
      return null
    }
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { customerId: string; phone: string; type: string; tenantId: string }
  } catch {
    return null
  }
}

export async function GET(req: Request) {
  try {
    // 1. Verify JWT token authentication
    const tokenPayload = await verifyPortalToken(req)
    if (!tokenPayload || tokenPayload.type !== 'portal') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const phone = url.searchParams.get('phone')

    if (!phone) {
      return NextResponse.json({ error: 'Phone required' }, { status: 400 })
    }

    // 2. Verify phone matches token
    if (phone.replace(/\s/g, '') !== tokenPayload.phone) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 3. CRITICAL FIX: Find customer with tenantId from token
    const customer = await db.customer.findFirst({
      where: {
        phone: phone.replace(/\s/g, ''),
        tenantId: tokenPayload.tenantId // Tenant isolation fix
      }
    })

    if (!customer) {
      return NextResponse.json([])
    }

    // 4. Verify customer matches token
    if (customer.id !== tokenPayload.customerId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookings = await db.booking.findMany({
      where: {
        customerId: customer.id,
        tenantId: tokenPayload.tenantId, // Extra tenant isolation
        deletedAt: null,
      },
      include: {
        service: true,
        staff: true,
      },
      orderBy: [
        { bookingDate: 'desc' },
        { startTime: 'desc' },
      ],
    })

    return NextResponse.json(bookings)
  } catch (error) {
    console.error('Portal bookings fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
  }
}
