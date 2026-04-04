import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// PUT - Kural güncelle
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()

    const existingRule = await db.dynamicPricingRule.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    const updatedRule = await db.dynamicPricingRule.update({
      where: { id },
      data: {
        ...body,
        updatedAt: new Date()
      }
    })

    return NextResponse.json(updatedRule)
  } catch (error) {
    console.error('Error updating pricing rule:', error)
    return NextResponse.json({ error: 'Error updating pricing rule' }, { status: 500 })
  }
}

// DELETE - Kural sil
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existingRule = await db.dynamicPricingRule.findFirst({
      where: { id, tenantId: session.user.tenantId }
    })

    if (!existingRule) {
      return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    }

    await db.dynamicPricingRule.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting pricing rule:', error)
    return NextResponse.json({ error: 'Error deleting pricing rule' }, { status: 500 })
  }
}
