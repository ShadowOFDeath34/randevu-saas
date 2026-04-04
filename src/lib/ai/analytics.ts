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

  // Peak hours analysis
  const peakHours = await db.$queryRawUnsafe<
    { hour: number; bookings: number }[]
  >(`
    SELECT
      EXTRACT(HOUR FROM b.time) as hour,
      COUNT(*) as bookings
    FROM "Booking" b
    WHERE b."tenantId" = $1
      AND b."bookingDate" >= $2
      AND b.status NOT IN ('cancelled', 'no_show')
    GROUP BY EXTRACT(HOUR FROM b.time)
    ORDER BY hour ASC
  `, tenantId, startDateStr)

  // Peak days analysis
  const peakDays = await db.$queryRawUnsafe<
    { day: string; bookings: number }[]
  >(`
    SELECT
      TO_CHAR(b."bookingDate", 'Day') as day,
      COUNT(*) as bookings
    FROM "Booking" b
    WHERE b."tenantId" = $1
      AND b."bookingDate" >= $2
      AND b.status NOT IN ('cancelled', 'no_show')
    GROUP BY TO_CHAR(b."bookingDate", 'Day'), EXTRACT(DOW FROM b."bookingDate")
    ORDER BY EXTRACT(DOW FROM b."bookingDate")
  `, tenantId, startDateStr)

  // Average booking lead time
  const leadTime = await db.$queryRawUnsafe<
    { avg_days: number }[]
  >(`
    SELECT
      AVG(EXTRACT(DAY FROM (b."bookingDate" - b."createdAt"))) as avg_days
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
    peakHours: peakHours.map(p => ({ hour: Number(p.hour), bookings: Number(p.bookings) })),
    peakDays: peakDays.map(p => ({ day: p.day.trim(), bookings: Number(p.bookings) })),
    avgBookingLeadTime: Math.round(leadTime[0]?.avg_days || 0),
    cancellationPatterns: [],
    customerRetention: {
      newCustomers: Number(newCust),
      returningCustomers: Number(returning),
      retentionRate: total > 0 ? Math.round((returning / total) * 100) : 0
    }
  }
}

export async function generateBookingPredictions(
  tenantId: string
): Promise<BookingPrediction> {
  // Get last 8 weeks of data for trend analysis
  const eightWeeksAgo = new Date()
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 56)

  const weeklyData = await db.$queryRawUnsafe<
    { week: string; bookings: number; revenue: number }[]
  >(`
    SELECT
      TO_CHAR(DATE_TRUNC('week', b."bookingDate"), 'YYYY-MM-DD') as week,
      COUNT(*) as bookings,
      COALESCE(SUM(CASE WHEN b.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
    FROM "Booking" b
    JOIN "Service" s ON b."serviceId" = s.id
    WHERE b."tenantId" = $1
      AND b."bookingDate" >= $2
      AND b.status NOT IN ('cancelled', 'no_show')
    GROUP BY DATE_TRUNC('week', b."bookingDate")
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
    recommendations.push('Randevu sayısı düşüş trendinde. Kampanya düşünün.')
  } else if (trend === 'up') {
    recommendations.push('Harika! Randevu sayısı artıyor.')
  }

  if (avgBookings < 20) {
    recommendations.push('Haftalık randevu sayınız düşük. Sosyal medya kampanyası önerilir.')
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
}

export async function segmentCustomers(
  tenantId: string
): Promise<CustomerSegment> {
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
        SUM(s.price) as total_spend
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
}
