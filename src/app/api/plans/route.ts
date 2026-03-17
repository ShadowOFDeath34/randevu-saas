import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const plans = await db.plan.findMany({
      orderBy: { price: 'asc' }
    })

    const formatted = plans.map(plan => ({
      id: plan.id,
      name: plan.name,
      price: plan.price,
      billingPeriod: plan.billingPeriod,
      features: JSON.parse(plan.featuresJson || '[]')
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('GET plans error:', error)
    return NextResponse.json({ error: 'Sunucu hatası' }, { status: 500 })
  }
}
