import { auth } from '@/lib/auth'
import { getBonusReport } from '@/lib/bonus/service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const staffId = searchParams.get('staffId')
    const period = searchParams.get('period') as 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | undefined
    const status = searchParams.get('status') as 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED' | undefined
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    const report = await getBonusReport(session.user.tenantId, {
      staffId: staffId || undefined,
      period,
      status
    })

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error fetching bonus report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bonus report' },
      { status: 500 }
    )
  }
}
