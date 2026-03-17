import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await db.subscription.findUnique({
      where: { tenantId: session.user.tenantId },
      include: { plan: true }
    })

    const invoices = await db.invoice.findMany({
      where: { tenantId: session.user.tenantId },
      orderBy: { dueDate: 'desc' }
    })

    return NextResponse.json({ subscription, invoices })
  } catch (error) {
    console.error('GET subscription error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
