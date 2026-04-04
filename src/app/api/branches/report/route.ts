import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBranchComparisonReport } from '@/lib/branch/service'

// GET - Şube karşılaştırma raporu
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    const report = await getBranchComparisonReport(session.user.tenantId, days)

    return NextResponse.json(report)
  } catch (error) {
    console.error('Error generating branch report:', error)
    return NextResponse.json({ error: 'Error generating branch report' }, { status: 500 })
  }
}
