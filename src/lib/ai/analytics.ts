import { db } from '@/lib/db'

export interface CustomerBehavior {
  peakHours: { hour: number; bookings: number }[]
  peakDays: { day: string; bookings: number }[]
  avgBookingLeadTime: number
  cancellationPatterns: { reason: string; count: number }[]
  customerRetention: {
    newCustomers: number
    returningCustomers: number
    retentionRate: number
  }
}

export interface BookingPrediction {
  nextWeek: {
    expectedBookings: number
    confidence: number
    trend: 'up' | 'down' | 'stable'
  }
  revenue: {
    expectedRevenue: number
    confidence: number
    trend: 'up' | 'down' | 'stable'
  }
  recommendations: string[]
}

export interface CustomerSegment {
  vip: { count: number; avgSpend: number }
  regular: { count: number; avgSpend: number }
  atRisk: { count: number; lastBooking: string }
  new: { count: number; conversionRate: number }
}

export async function analyzeCustomerBehavior(
  tenantId: string,
  startDate: Date
): Promise<CustomerBehavior> {
  const startDateStr = startDate.toISOString().split('T')[0]

  try {
    // Peak hours analysis - SQLite compatible
    const bookings = await db.$queryRawUnsafe<
      { time: string; bookings: number }[]
    >(`
      SELECT
        time,
        COUNT(*) as bookings
      FROM "Booking" b
      WHERE b."tenantId" = $1
        AND b."bookingDate" >= $2
        AND b.status NOT IN ('cancelled', 'no_show')
    `, tenantId, startDateStr)

    // Process peak hours from time strings
    const hourMap = new Map<number, number>()
    bookings.forEach(b => {
      const hour = parseInt(b.time.split(':')[0])
      hourMap.set(hour, (hourMap.get(hour) || 0) + Number(b.bookings))
    })
    const peakHours = Array.from(hourMap.entries()).map(([hour, count]) => ({ hour, bookings: count })).sort((a, b) => a.hour - b.hour)

    // Peak days analysis - SQLite compatible (use strftime)
    const peakDays = await db.$queryRawUnsafe<
      { day: string; bookings: number }[]
    >(`
      SELECT
        CASE CAST(strftime('%w', b."bookingDate") AS INTEGER)
          WHEN 0 THEN 'Pazar'
          WHEN 1 THEN 'Pazartesi'
          WHEN 2 THEN 'Sali'
          WHEN 3 THEN 'Carsamba'
          WHEN 4 THEN 'Persembe'
          WHEN 5 THEN 'Cuma'
          WHEN 6 THEN 'Cumartesi'
        END as day,
        COUNT(*) as bookings
      FROM "Booking" b
      WHERE b."tenantId" = $1
        AND b."bookingDate" >= $2
        AND b.status NOT IN ('cancelled', 'no_show')
      GROUP BY strftime('%w', b."bookingDate")
      ORDER BY CAST(strftime('%w', b."bookingDate") AS INTEGER)
    `, tenantId, startDateStr)

    // Average booking lead time - SQLite compatible
    const leadTime = await db.$queryRawUnsafe<
      { avg_days: number }[]
    >(`
      SELECT
        AVG(julianday(b."bookingDate") - julianday(b."createdAt")) as avg_days
      FROM "Booking" b
      WHERE b."tenantId" = $1
        AND b."bookingDate" >= $2
        AND b.status NOT IN ('cancelled', 'no_show')
    `, tenantId, startDateStr)

    // Customer retention analysis
    const retention = await db.$queryRawUnsafe<
      { status: string; count: number }[]
    >(`
      SELECT
        CASE
          WHEN booking_count > 1 THEN 'returning'
          ELSE 'new'
        END as status,
        COUNT(*) as count
      FROM (
        SELECT "customerId", COUNT(*) as booking_count
        FROM "Booking"
        WHERE "tenantId" = $1
          AND "bookingDate" >= $2
        GROUP BY "customerId"
      ) customer_stats
      GROUP BY CASE WHEN booking_count > 1 THEN 'returning' ELSE 'new' END
    `, tenantId, startDateStr)

    const returning = retention.find(r => r.status === 'returning')?.count || 0
    const newCust = retention.find(r => r.status === 'new')?.count || 0
    const total = returning + newCust

    return {
      peakHours,
      peakDays: peakDays.map(p => ({ day: p.day, bookings: Number(p.bookings) })),
      avgBookingLeadTime: Math.round(leadTime[0]?.avg_days || 0),
      cancellationPatterns: [],
      customerRetention: {
        newCustomers: Number(newCust),
        returningCustomers: Number(returning),
        retentionRate: total > 0 ? Math.round((returning / total) * 100) : 0
      }
    }
  } catch (error) {
    console.error('Error in analyzeCustomerBehavior:', error)
    // Return empty data on error
    return {
      peakHours: [],
      peakDays: [],
      avgBookingLeadTime: 0,
      cancellationPatterns: [],
      customerRetention: {
        newCustomers: 0,
        returningCustomers: 0,
        retentionRate: 0
      }
    }
  }
}

export async function generateBookingPredictions(
  tenantId: string
): Promise<BookingPrediction> {
  try {
    // Get last 8 weeks of data for trend analysis
    const eightWeeksAgo = new Date()
    eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

    const weeklyData = await db.$queryRawUnsafe<
      { week: string; bookings: number; revenue: number }[]
    >(`
      SELECT
        strftime('%Y-%W', b."bookingDate") as week,
        COUNT(*) as bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
      FROM "Booking" b
      JOIN "Service" s ON b."serviceId" = s.id
      WHERE b."tenantId" = $1
        AND b."bookingDate" >= $2
        AND b.status NOT IN ('cancelled', 'no_show')
      GROUP BY strftime('%Y-%W', b."bookingDate")
      ORDER BY week DESC
      LIMIT 8
    `, tenantId, eightWeeksAgo.toISOString().split('T')[0])

    // Simple trend analysis
    const bookings = weeklyData.map(w => Number(w.bookings))
    const revenues = weeklyData.map(w => Number(w.revenue))

    const avgBookings = bookings.reduce((a, b) => a + b, 0) / bookings.length || 0
    const avgRevenue = revenues.reduce((a, b) => a + b, 0) / revenues.length || 0

    // Calculate trend
    const firstHalf = bookings.slice(0, Math.floor(bookings.length / 2))
    const secondHalf = bookings.slice(Math.floor(bookings.length / 2))
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length || 0
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length || 0

    let trend: 'up' | 'down' | 'stable' = 'stable'
    if (secondAvg > firstAvg * 1.1) trend = 'up'
    else if (secondAvg < firstAvg * 0.9) trend = 'down'

    // Generate recommendations based on data
    const recommendations: string[] = []

    if (trend === 'down') {
      recommendations.push('Randevu sayisi dusus trendinde. Kampanya dusunun.')
    } else if (trend === 'up') {
      recommendations.push('Harika! Randevu sayisi artiyor.')
    }

    if (avgBookings < 20) {
      recommendations.push('Haftalik randevu sayiniz dusuk. Sosyal medya kampanyasi onerilir.')
    }

    return {
      nextWeek: {
        expectedBookings: Math.round(avgBookings),
        confidence: 75,
        trend
      },
      revenue: {
        expectedRevenue: Math.round(avgRevenue),
        confidence: 75,
        trend
      },
      recommendations
    }
  } catch (error) {
    console.error('Error in generateBookingPredictions:', error)
    return {
      nextWeek: {
        expectedBookings: 0,
        confidence: 0,
        trend: 'stable'
      },
      revenue: {
        expectedRevenue: 0,
        confidence: 0,
        trend: 'stable'
      },
      recommendations: ['Yeterli veri bulunmuyor.']
    }
  }
}

export async function segmentCustomers(
  tenantId: string
): Promise<CustomerSegment> {
  try {
    // VIP customers (high spend, frequent)
    const vipCustomers = await db.$queryRawUnsafe<
      { count: number; avg_spend: number }[]
    >(`
      SELECT
        COUNT(*) as count,
        AVG(total_spent) as avg_spend
      FROM (
        SELECT
          b."customerId",
          SUM(s.price) as total_spent,
          COUNT(*) as booking_count
        FROM "Booking" b
        JOIN "Service" s ON b."serviceId" = s.id
        WHERE b."tenantId" = $1
          AND b.status = 'completed'
        GROUP BY b."customerId"
        HAVING COUNT(*) >= 5 AND SUM(s.price) >= 5000
      ) vip_stats
    `, tenantId)

    // Regular customers
    const regularCustomers = await db.$queryRawUnsafe<
      { count: number; avg_spend: number }[]
    >(`
      SELECT
        COUNT(*) as count,
        AVG(total_spent) as avg_spend
      FROM (
        SELECT
          b."customerId",
          SUM(s.price) as total_spent
        FROM "Booking" b
        JOIN "Service" s ON b."serviceId" = s.id
        WHERE b."tenantId" = $1
          AND b.status = 'completed'
        GROUP BY b."customerId"
        HAVING COUNT(*) >= 2
      ) regular_stats
    `, tenantId)

    // At-risk customers (no booking in last 60 days)
    const sixtyDaysAgo = new Date()
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

    const atRiskCustomers = await db.$queryRawUnsafe<
      { count: number; last_booking: string }[]
    >(`
      SELECT
        COUNT(*) as count,
        MAX(last_booking) as last_booking
      FROM (
        SELECT
          b."customerId",
          MAX(b."bookingDate") as last_booking
        FROM "Booking" b
        WHERE b."tenantId" = $1
        GROUP BY b."customerId"
        HAVING MAX(b."bookingDate") < $2
      ) at_risk
    `, tenantId, sixtyDaysAgo.toISOString().split('T')[0])

    // New customers (registered in last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const newCustomers = await db.$queryRawUnsafe<
      { count: number; booking_count: number }[]
    >(`
      SELECT
        COUNT(*) as count,
        SUM(CASE WHEN b.id IS NOT NULL THEN 1 ELSE 0 END) as booking_count
      FROM "Customer" c
      LEFT JOIN "Booking" b ON c.id = b."customerId"
        AND b."tenantId" = $1
      WHERE c."tenantId" = $1
        AND c."createdAt" >= $2
    `, tenantId, thirtyDaysAgo.toISOString().split('T')[0])

    const newCount = Number(newCustomers[0]?.count || 0)
    const withBookings = Number(newCustomers[0]?.booking_count || 0)

    return {
      vip: {
        count: Number(vipCustomers[0]?.count || 0),
        avgSpend: Math.round(vipCustomers[0]?.avg_spend || 0)
      },
      regular: {
        count: Number(regularCustomers[0]?.count || 0),
        avgSpend: Math.round(regularCustomers[0]?.avg_spend || 0)
      },
      atRisk: {
        count: Number(atRiskCustomers[0]?.count || 0),
        lastBooking: atRiskCustomers[0]?.last_booking || ''
      },
      new: {
        count: newCount,
        conversionRate: newCount > 0 ? Math.round((withBookings / newCount) * 100) : 0
      }
    }
  } catch (error) {
    console.error('Error in segmentCustomers:', error)
    return {
      vip: { count: 0, avgSpend: 0 },
      regular: { count: 0, avgSpend: 0 },
      atRisk: { count: 0, lastBooking: '' },
      new: { count: 0, conversionRate: 0 }
    }
  }
}
