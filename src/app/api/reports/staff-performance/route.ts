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
    if (period === 'week') {
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    } else if (period === 'month') {
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    } else {
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    }

    const startDateStr = startDate.toISOString().split('T')[0]

    // Get all active staff
    const staff = await db.staff.findMany({
      where: { tenantId, isActive: true },
      select: { id: true, fullName: true }
    })

    // Get performance metrics for each staff member
    const staffPerformance = await Promise.all(
      staff.map(async (member) => {
        const [
          totalBookings,
          completedBookings,
          cancelledBookings,
          noShowBookings,
          totalRevenue
        ] = await Promise.all([
          db.booking.count({
            where: {
              tenantId,
              staffId: member.id,
              deletedAt: null,
              bookingDate: { gte: startDateStr }
            }
          }),
          db.booking.count({
            where: {
              tenantId,
              staffId: member.id,
              status: 'completed',
              deletedAt: null,
              bookingDate: { gte: startDateStr }
            }
          }),
          db.booking.count({
            where: {
              tenantId,
              staffId: member.id,
              status: 'cancelled',
              deletedAt: null,
              bookingDate: { gte: startDateStr }
            }
          }),
          db.booking.count({
            where: {
              tenantId,
              staffId: member.id,
              status: 'no_show',
              deletedAt: null,
              bookingDate: { gte: startDateStr }
            }
          }),
          db.booking.findMany({
            where: {
              tenantId,
              staffId: member.id,
              status: 'completed',
              deletedAt: null,
              bookingDate: { gte: startDateStr }
            },
            include: { service: true }
          }).then(bookings =>
            bookings.reduce((sum, b) => sum + (b.service?.price || 0), 0)
          )
        ])

        const completionRate = totalBookings > 0
          ? Math.round((completedBookings / totalBookings) * 100)
          : 0

        const noShowRate = totalBookings > 0
          ? Math.round((noShowBookings / totalBookings) * 100)
          : 0

        return {
          id: member.id,
          name: member.fullName,
          totalBookings,
          completedBookings,
          cancelledBookings,
          noShowBookings,
          totalRevenue,
          completionRate,
          noShowRate,
          averageRevenuePerBooking: completedBookings > 0
            ? Math.round(totalRevenue / completedBookings)
            : 0
        }
      })
    )

    // Sort by total revenue
    staffPerformance.sort((a, b) => b.totalRevenue - a.totalRevenue)

    // Calculate team averages
    const teamStats = {
      totalStaff: staff.length,
      averageBookingsPerStaff: staff.length > 0
        ? Math.round(staffPerformance.reduce((sum, s) => sum + s.totalBookings, 0) / staff.length)
        : 0,
      averageRevenuePerStaff: staff.length > 0
        ? Math.round(staffPerformance.reduce((sum, s) => sum + s.totalRevenue, 0) / staff.length)
        : 0,
      averageCompletionRate: staff.length > 0
        ? Math.round(staffPerformance.reduce((sum, s) => sum + s.completionRate, 0) / staff.length)
        : 0
    }

    return NextResponse.json({
      staff: staffPerformance,
      teamStats
    })
  } catch (error) {
    console.error('Staff performance report error:', error)
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 })
  }
}
