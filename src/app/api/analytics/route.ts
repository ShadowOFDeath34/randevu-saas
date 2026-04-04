import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import {
  analyzeCustomerBehavior,
  generateBookingPredictions,
  segmentCustomers
} from '@/lib/ai/analytics'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month'

    const tenantId = session.user.tenantId

    let startDate: Date
    const now = new Date()

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case 'year':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        startDate = new Date(now.setMonth(now.getMonth() - 1))
    }

    const startDateStr = startDate.toISOString().split('T')[0]

    // Single optimized aggregation query using raw SQL for complex aggregations
    const [
      bookingStats,
      totalCustomers,
      repeatCustomersAgg,
      popularServicesAgg,
      topStaffAgg,
      dailyBookingsAgg,
      // AI Analytics
      customerBehavior,
      predictions,
      customerSegments
    ] = await Promise.all([
      // Single query for all booking counts by status + revenue
      db.$queryRawUnsafe<{ status: string; count: bigint; revenue: number }[]>(`
        SELECT
          b.status,
          COUNT(*) as count,
          COALESCE(SUM(CASE WHEN b.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
        FROM "Booking" b
        JOIN "Service" s ON b."serviceId" = s.id
        WHERE b."tenantId" = $1
          AND b."bookingDate" >= $2
        GROUP BY b.status
      `, tenantId, startDateStr),

      // Total customers count
      db.customer.count({ where: { tenantId } }),

      // Repeat customers (customers with >1 booking) - single aggregation
      db.$queryRawUnsafe<{ repeat_count: bigint }[]>(`
        SELECT COUNT(*) as repeat_count
        FROM (
          SELECT "customerId", COUNT(*) as booking_count
          FROM "Booking"
          WHERE "tenantId" = $1
          GROUP BY "customerId"
          HAVING COUNT(*) > 1
        ) as repeat_customers
      `, tenantId),

      // Popular services with booking counts - aggregated in DB
      db.$queryRawUnsafe<{ name: string; count: bigint; revenue: number }[]>(`
        SELECT
          s.name,
          COUNT(b.id) as count,
          COALESCE(SUM(CASE WHEN b.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
        FROM "Service" s
        LEFT JOIN "Booking" b ON s.id = b."serviceId"
          AND b."bookingDate" >= $2
        WHERE s."tenantId" = $1
          AND s."isActive" = true
        GROUP BY s.id, s.name
        ORDER BY count DESC
        LIMIT 10
      `, tenantId, startDateStr),

      // Top staff with booking counts - aggregated in DB
      db.$queryRawUnsafe<{ name: string; count: bigint; revenue: number }[]>(`
        SELECT
          st."fullName" as name,
          COUNT(b.id) as count,
          COALESCE(SUM(CASE WHEN b.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
        FROM "Staff" st
        LEFT JOIN "Booking" b ON st.id = b."staffId"
          AND b."bookingDate" >= $2
        LEFT JOIN "Service" s ON b."serviceId" = s.id
        WHERE st."tenantId" = $1
          AND st."isActive" = true
        GROUP BY st.id, st."fullName"
        ORDER BY count DESC
        LIMIT 10
      `, tenantId, startDateStr),

      // Daily bookings aggregation
      db.$queryRawUnsafe<{ date: string; count: bigint; revenue: number }[]>(`
        SELECT
          b."bookingDate" as date,
          COUNT(*) as count,
          COALESCE(SUM(CASE WHEN b.status = 'completed' THEN s.price ELSE 0 END), 0) as revenue
        FROM "Booking" b
        JOIN "Service" s ON b."serviceId" = s.id
        WHERE b."tenantId" = $1
          AND b."bookingDate" >= $2
        GROUP BY b."bookingDate"
        ORDER BY b."bookingDate" ASC
      `, tenantId, startDateStr),

      // AI Analytics
      analyzeCustomerBehavior(tenantId, startDate),
      generateBookingPredictions(tenantId),
      segmentCustomers(tenantId)
    ])

    // Process aggregated results
    const bookingStatsMap = new Map(bookingStats.map(s => [s.status, { count: Number(s.count), revenue: s.revenue }]))

    const totalBookings = bookingStats.reduce((sum, s) => sum + Number(s.count), 0)
    const completedBookings = Number(bookingStatsMap.get('completed')?.count || 0)
    const cancelledBookings = Number(bookingStatsMap.get('cancelled')?.count || 0)
    const noShowBookings = Number(bookingStatsMap.get('no_show')?.count || 0)
    const totalRevenue = bookingStats.reduce((sum, s) => sum + s.revenue, 0)

    // Weekly stats calculated from daily aggregation
    const dayNames = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt']
    const weeklyStatsMap = new Map(dayNames.map(day => [day, { bookings: 0, revenue: 0 }]))

    dailyBookingsAgg.forEach(day => {
      const date = new Date(day.date)
      const dayName = dayNames[date.getDay()]
      const stats = weeklyStatsMap.get(dayName)!
      stats.bookings += Number(day.count)
      stats.revenue += day.revenue
    })

    const weeklyStats = dayNames.map(day => ({
      day,
      bookings: weeklyStatsMap.get(day)?.bookings || 0,
      revenue: weeklyStatsMap.get(day)?.revenue || 0
    }))

    return NextResponse.json({
      // Basic stats
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      totalRevenue,
      totalCustomers,
      repeatCustomers: Number(repeatCustomersAgg[0]?.repeat_count || 0),
      averageRating: 0,
      popularServices: popularServicesAgg.map(s => ({ name: s.name, count: Number(s.count) })),
      topStaff: topStaffAgg.map(s => ({ name: s.name, count: Number(s.count) })),
      dailyBookings: dailyBookingsAgg.map(d => ({ date: d.date, count: Number(d.count) })),
      weeklyStats,
      // AI Analytics
      ai: {
        customerBehavior,
        predictions,
        customerSegments
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Error fetching analytics' }, { status: 500 })
  }
}
