import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [totalTenants, activeTenants, totalBookings, totalCustomers] = await Promise.all([
      db.tenant.count(),
      db.tenant.count({ where: { status: 'active' } }),
      db.booking.count(),
      db.customer.count()
    ])

    return NextResponse.json({
      totalTenants,
      activeTenants,
      totalBookings,
      totalCustomers
    })
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json({ error: 'Error fetching stats' }, { status: 500 })
  }
}
