import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrCreateLoyaltyConfig } from '@/lib/loyalty/service'

// GET /api/loyalty/config - Get loyalty config
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const config = await getOrCreateLoyaltyConfig(tenantId)

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching loyalty config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/loyalty/config - Update loyalty config
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const body = await req.json()

    const config = await db.loyaltyConfig.upsert({
      where: { tenantId },
      update: {
        ...body,
        updatedAt: new Date()
      },
      create: {
        tenantId,
        ...body
      }
    })

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating loyalty config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
