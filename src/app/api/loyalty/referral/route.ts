import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createReferralCode, processReferral } from '@/lib/loyalty/service'

// GET /api/loyalty/referral - Get or create referral code
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    let customer = await db.customer.findUnique({
      where: { id: customerId },
      select: { referralCode: true }
    })

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Create code if doesn't exist
    if (!customer.referralCode) {
      const code = await createReferralCode(customerId)
      return NextResponse.json({ referralCode: code })
    }

    return NextResponse.json({ referralCode: customer.referralCode })
  } catch (error) {
    console.error('Error getting referral code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/loyalty/referral - Submit referral code (for new customers)
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const body = await req.json()
    const { customerId, referralCode } = body

    if (!customerId || !referralCode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if customer already has a referrer
    const existingCustomer = await db.customer.findUnique({
      where: { id: customerId },
      select: { referredBy: true }
    })

    if (existingCustomer?.referredBy) {
      return NextResponse.json({ error: 'Customer already has a referrer' }, { status: 400 })
    }

    // Check if trying to refer self
    const referrer = await db.customer.findFirst({
      where: { referralCode, tenantId },
      select: { id: true }
    })

    if (referrer?.id === customerId) {
      return NextResponse.json({ error: 'Cannot refer yourself' }, { status: 400 })
    }

    await processReferral(tenantId, referralCode, customerId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing referral:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
