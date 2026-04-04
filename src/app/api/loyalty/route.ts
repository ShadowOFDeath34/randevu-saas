import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrCreateLoyaltyConfig } from '@/lib/loyalty/service'

// GET /api/loyalty - Get customer's loyalty info
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const { searchParams } = new URL(req.url)
    const customerId = searchParams.get('customerId')

    if (!customerId) {
      return NextResponse.json({ error: 'Customer ID required' }, { status: 400 })
    }

    const [customer, config, transactions, rewards, referrals] = await Promise.all([
      db.customer.findUnique({
        where: { id: customerId, tenantId },
        select: {
          id: true,
          fullName: true,
          loyaltyPoints: true,
          loyaltyTier: true,
          totalPointsEarned: true,
          referralCode: true
        }
      }),
      getOrCreateLoyaltyConfig(tenantId),
      db.loyaltyTransaction.findMany({
        where: { customerId },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      db.rewardRedemption.findMany({
        where: {
          customerId,
          status: 'active',
          expiryDate: { gt: new Date() }
        },
        orderBy: { createdAt: 'desc' }
      }),
      db.referral.count({
        where: { referrerId: customerId, status: 'completed' }
      })
    ])

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
    }

    // Calculate next tier progress
    let nextTierPoints = 0
    let currentTierMax = 0
    switch (customer.loyaltyTier) {
      case 'BRONZE':
        nextTierPoints = config.silverThreshold
        currentTierMax = 0
        break
      case 'SILVER':
        nextTierPoints = config.goldThreshold
        currentTierMax = config.silverThreshold
        break
      case 'GOLD':
        nextTierPoints = config.platinumThreshold
        currentTierMax = config.goldThreshold
        break
      case 'PLATINUM':
        nextTierPoints = customer.totalPointsEarned
        currentTierMax = config.platinumThreshold
        break
    }

    const tierProgress = customer.loyaltyTier === 'PLATINUM'
      ? 100
      : Math.round(((customer.totalPointsEarned - currentTierMax) / (nextTierPoints - currentTierMax)) * 100)

    return NextResponse.json({
      customer: {
        ...customer,
        referralCode: customer.referralCode || null
      },
      config,
      transactions,
      activeRewards: rewards,
      completedReferrals: referrals,
      nextTierProgress: tierProgress,
      pointsToNextTier: Math.max(0, nextTierPoints - customer.totalPointsEarned)
    })
  } catch (error) {
    console.error('Error fetching loyalty info:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/loyalty/redeem - Redeem points for reward
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenantId = session.user.tenantId
    const body = await req.json()
    const { customerId, rewardType, pointsCost, value } = body

    if (!customerId || !rewardType || !pointsCost) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { redeemPoints } = await import('@/lib/loyalty/service')
    const result = await redeemPoints(tenantId, customerId, rewardType, pointsCost, value)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    return NextResponse.json({ success: true, rewardId: result.rewardId })
  } catch (error) {
    console.error('Error redeeming points:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
