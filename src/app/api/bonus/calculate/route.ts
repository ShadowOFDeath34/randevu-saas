import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// POST - Calculate bonuses
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validation
    const schema = z.object({
      period: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
      referenceDate: z.string().optional(),
      calculateAll: z.boolean().default(true)
    })

    const validated = schema.parse(data)

    // Get config
    const config = await db.bonusConfig.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    if (!config || !config.isEnabled) {
      return NextResponse.json(
        { error: 'Bonus system is not configured or disabled' },
        { status: 400 }
      )
    }

    // Calculate period dates
    const now = validated.referenceDate ? new Date(validated.referenceDate) : new Date()
    const year = now.getFullYear()
    let month: number | undefined
    let week: number | undefined
    let quarter: number | undefined

    if (validated.period === 'MONTHLY') {
      month = now.getMonth() + 1
    } else if (validated.period === 'WEEKLY') {
      // Calculate week number
      const startOfYear = new Date(year, 0, 1)
      const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
      week = Math.ceil(days / 7)
    } else if (validated.period === 'QUARTERLY') {
      quarter = Math.floor((now.getMonth() + 3) / 3)
    }

    // Get all staff
    const staffList = await db.staff.findMany({
      where: { tenantId: session.user.tenantId, isActive: true }
    })

    // Calculate bonus for each staff
    const calculatedBonuses = []

    for (const staff of staffList) {
      // Get staff's custom target if exists
      const target = await db.staffBonusTarget.findFirst({
        where: {
          staffId: staff.id,
          period: validated.period,
          year,
          month,
          week,
          quarter
        }
      })

      // Calculate metrics (simplified - can be expanded)
      // Get bookings in period
      const startDate = new Date(year, (month || 1) - 1, 1)
      const endDate = month
        ? new Date(year, month, 0)
        : new Date(year, 11, 31)

      // Format dates for string comparison (ISO format)
      const startStr = startDate.toISOString()
      const endStr = endDate.toISOString()

      const bookings = await db.booking.findMany({
        where: {
          staffId: staff.id,
          status: 'completed',
          startTime: {
            gte: startStr,
            lte: endStr
          }
        }
      })

      const actualBookingCount = bookings.length
      // Get service prices for revenue calculation
      const serviceIds = [...new Set(bookings.map(b => b.serviceId))]
      const services = await db.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, price: true }
      })
      const servicePriceMap = new Map(services.map(s => [s.id, s.price || 0]))
      const actualRevenue = bookings.reduce((sum, b) => sum + (servicePriceMap.get(b.serviceId) || 0), 0)

      // Check minimum requirements
      if (actualBookingCount < config.minBookingCount) {
        continue // Skip if minimum not met
      }

      // Calculate bonus
      let calculatedBonus = 0
      const calculationBreakdown: any = {
        basePercentage: config.baseBonusPercentage,
        actualBookingCount,
        actualRevenue,
        calculationType: target?.calculationType || 'TIERED'
      }

      if (target?.calculationType === 'FIXED_AMOUNT') {
        calculatedBonus = target.baseAmount
        calculationBreakdown.baseAmount = target.baseAmount
      } else if (target?.calculationType === 'PERCENTAGE') {
        calculatedBonus = actualRevenue * (target.percentageRate / 100)
        calculationBreakdown.percentageRate = target.percentageRate
      } else {
        // TIERED - default behavior
        calculatedBonus = actualRevenue * (config.baseBonusPercentage / 100)
      }

      // Create or update bonus record
      const bonus = await db.staffBonus.upsert({
        where: {
          staffId_period_year_month_week: {
            staffId: staff.id,
            period: validated.period,
            year,
            month: (month ?? null) as any,
            week: (week ?? null) as any
          }
        },
        update: {
          actualBookingCount,
          actualRevenue,
          calculatedBonus,
          bonusPercentage: config.baseBonusPercentage,
          calculationBreakdown: JSON.stringify(calculationBreakdown),
          status: 'CALCULATED'
        },
        create: {
          tenantId: session.user.tenantId,
          staffId: staff.id,
          targetId: target?.id || '',
          period: validated.period,
          year,
          month,
          week,
          actualBookingCount,
          actualRevenue,
          actualCustomerRating: 0,
          actualUpsellRate: 0,
          actualAttendanceRate: 0,
          calculatedBonus,
          bonusPercentage: config.baseBonusPercentage,
          calculationBreakdown: JSON.stringify(calculationBreakdown),
          status: 'CALCULATED'
        }
      })

      calculatedBonuses.push({
        id: bonus.id,
        staffId: staff.id,
        staffName: staff.fullName,
        calculatedBonus,
        status: bonus.status
      })
    }

    return NextResponse.json({
      success: true,
      calculated: calculatedBonuses.length,
      bonuses: calculatedBonuses
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error calculating bonuses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
