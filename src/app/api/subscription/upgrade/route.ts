import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await req.json()

    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan bulunamadı' }, { status: 404 })
    }

    const subscription = await db.subscription.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'Abonelik bulunamadı' }, { status: 404 })
    }

    const billingEnd = new Date()
    billingEnd.setMonth(billingEnd.getMonth() + (plan.billingPeriod === 'aylık' ? 1 : 12))

    const updated = await db.subscription.update({
      where: { id: subscription.id },
      data: {
        planId,
        status: 'active',
        endDate: billingEnd
      }
    })

    const invoiceNumber = `INV-${Date.now()}`
    await db.invoice.create({
      data: {
        subscriptionId: subscription.id,
        tenantId: session.user.tenantId,
        amount: plan.price,
        status: 'paid',
        dueDate: new Date(),
        paidAt: new Date(),
        invoiceNumber,
        description: `${plan.name} - ${plan.billingPeriod}`
      }
    })

    return NextResponse.json({ success: true, subscription: updated })
  } catch (error) {
    console.error('Upgrade error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
