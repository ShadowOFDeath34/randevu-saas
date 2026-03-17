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

    const [
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      totalCustomers,
      services,
      staff,
      bookings
    ] = await Promise.all([
      db.booking.count({
        where: { tenantId, bookingDate: { gte: startDate.toISOString().split('T')[0] } }
      }),
      db.booking.count({
        where: { tenantId, bookingDate: { gte: startDate.toISOString().split('T')[0] }, status: 'completed' }
      }),
      db.booking.count({
        where: { tenantId, bookingDate: { gte: startDate.toISOString().split('T')[0] }, status: 'cancelled' }
      }),
      db.booking.count({
        where: { tenantId, bookingDate: { gte: startDate.toISOString().split('T')[0] }, status: 'no_show' }
      }),
      db.customer.count({ where: { tenantId } }),
      db.service.findMany({
        where: { tenantId, isActive: true },
        include: {
          _count: { select: { bookings: true } }
        }
      }),
      db.staff.findMany({
        where: { tenantId, isActive: true },
        include: {
          _count: { select: { bookings: true } }
        }
      }),
      db.booking.findMany({
        where: { 
          tenantId, 
          bookingDate: { gte: startDate.toISOString().split('T')[0] }
        },
        include: {
          service: true
        }
      })
    ])

    const totalRevenue = bookings
      .filter(b => b.status === 'completed')
      .reduce((sum, b) => sum + (b.service?.price || 0), 0)

    const customerBookingCounts = await db.booking.groupBy({
      by: ['customerId'],
      where: { tenantId },
      _count: true
    })

    const repeatCustomers = customerBookingCounts.filter(c => c._count > 1).length

    const popularServices = services
      .map(s => ({ name: s.name, count: s._count.bookings }))
      .sort((a, b) => b.count - a.count)

    const topStaff = staff
      .map(s => ({ name: s.fullName, count: s._count.bookings }))
      .sort((a, b) => b.count - a.count)

    const dailyBookingsMap = new Map<string, number>()
    bookings.forEach(b => {
      const count = dailyBookingsMap.get(b.bookingDate) || 0
      dailyBookingsMap.set(b.bookingDate, count + 1)
    })

    const dailyBookings = Array.from(dailyBookingsMap.entries())
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))

    const dayNames = ['Paz', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
    const weeklyStats = dayNames.map(day => {
      const dayBookings = bookings.filter(b => {
        const d = new Date(b.bookingDate)
        return dayNames[d.getDay()] === day
      })
      return {
        day,
        bookings: dayBookings.length,
        revenue: dayBookings
          .filter(b => b.status === 'completed')
          .reduce((sum, b) => sum + (b.service?.price || 0), 0)
      }
    })

    return NextResponse.json({
      totalBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      totalRevenue,
      totalCustomers,
      repeatCustomers,
      averageRating: 0,
      popularServices,
      topStaff,
      dailyBookings,
      weeklyStats
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Error fetching analytics' }, { status: 500 })
  }
}
