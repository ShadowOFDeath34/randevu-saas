import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'month'

    const tenantId = session.user.tenantId
    const now = new Date()

    let startDate: Date
    let groupBy: 'day' | 'week' | 'month'

    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      groupBy = 'day'
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      groupBy = 'day'
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      groupBy = 'month'
    }

    const startDateStr = startDate.toISOString().split('T')[0]

    // Get completed bookings with services
    const bookings = await db.booking.findMany({
      where: {
        tenantId,
        status: 'completed',
        deletedAt: null,
        bookingDate: { gte: startDateStr }
      },
      include: {
        service: true
      },
      orderBy: { bookingDate: 'asc' }
    })

    // Calculate revenue by date
    const revenueByDate = new Map<string, { revenue: number; bookings: number }>()

    bookings.forEach(booking => {
      const date = booking.bookingDate
      const current = revenueByDate.get(date) || { revenue: 0, bookings: 0 }
      const servicePrice = booking.service?.price || 0

      revenueByDate.set(date, {
        revenue: current.revenue + servicePrice,
        bookings: current.bookings + 1
      })
    })

    // Calculate service revenue breakdown
    const serviceRevenue = new Map<string, { name: string; revenue: number; count: number }>()

    bookings.forEach(booking => {
      const serviceId = booking.serviceId
      const serviceName = booking.service?.name || 'Unknown'
      const price = booking.service?.price || 0

      const current = serviceRevenue.get(serviceId) || { name: serviceName, revenue: 0, count: 0 }
      serviceRevenue.set(serviceId, {
        name: serviceName,
        revenue: current.revenue + price,
        count: current.count + 1
      })
    })

    // Calculate totals
    const totalRevenue = bookings.reduce((sum, b) => sum + (b.service?.price || 0), 0)
    const totalBookings = bookings.length
    const averageRevenuePerBooking = totalBookings > 0 ? totalRevenue / totalBookings : 0

    // Get previous period for comparison
    const prevStartDate = new Date(startDate)
    prevStartDate.setDate(prevStartDate.getDate() - (period === 'year' ? 365 : period === 'month' ? 30 : 7))
    const prevStartDateStr = prevStartDate.toISOString().split('T')[0]

    const prevBookings = await db.booking.findMany({
      where: {
        tenantId,
        status: 'completed',
        deletedAt: null,
        bookingDate: { gte: prevStartDateStr, lt: startDateStr }
      },
      include: { service: true }
    })

    const prevRevenue = prevBookings.reduce((sum, b) => sum + (b.service?.price || 0), 0)
    const revenueGrowth = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0

    return NextResponse.json({
      summary: {
        totalRevenue,
        totalBookings,
        averageRevenuePerBooking,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      },
      dailyRevenue: Array.from(revenueByDate.entries()).map(([date, data]) => ({
        date,
        ...data
      })),
      serviceBreakdown: Array.from(serviceRevenue.values())
        .sort((a, b) => b.revenue - a.revenue)
    })
  } catch (error) {
    console.error('Revenue report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
