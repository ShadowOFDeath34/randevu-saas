import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Tüm fiyatlandırma kurallarını getir
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rules = await db.dynamicPricingRule.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }]
    })

    return NextResponse.json(rules)
  } catch (error) {
    console.error('Error fetching pricing rules:', error)
    return NextResponse.json({ error: 'Error fetching pricing rules' }, { status: 500 })
  }
}

// POST - Yeni kural ekle
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      name,
      description,
      ruleType,
      adjustmentType,
      adjustmentValue,
      priority,
      startDate,
      endDate,
      daysOfWeek,
      startTime,
      endTime,
      minOccupancy,
      maxOccupancy,
      serviceIds,
      staffIds,
      minLoyaltyTier,
      maxUsesPerDay,
      maxUsesPerWeek
    } = body

    const rule = await db.dynamicPricingRule.create({
      data: {
        tenantId: session.user.tenantId,
        name,
        description,
        ruleType,
        adjustmentType,
        adjustmentValue,
        priority: priority || 0,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        daysOfWeek: daysOfWeek || [],
        startTime,
        endTime,
        minOccupancy,
        maxOccupancy,
        serviceIds: serviceIds || [],
        staffIds: staffIds || [],
        minLoyaltyTier,
        maxUsesPerDay,
        maxUsesPerWeek
      }
    })

    return NextResponse.json(rule)
  } catch (error) {
    console.error('Error creating pricing rule:', error)
    return NextResponse.json({ error: 'Error creating pricing rule' }, { status: 500 })
  }
}
