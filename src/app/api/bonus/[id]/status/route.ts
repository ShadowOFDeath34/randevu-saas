import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// PATCH - Update bonus status
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const data = await request.json()

    // Validation
    const schema = z.object({
      status: z.enum(['PENDING', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED'])
    })

    const validated = schema.parse(data)

    // Check if bonus exists and belongs to tenant
    const bonus = await db.staffBonus.findFirst({
      where: {
        id,
        tenantId: session.user.tenantId
      }
    })

    if (!bonus) {
      return NextResponse.json({ error: 'Bonus not found' }, { status: 404 })
    }

    // Update status with appropriate timestamps
    const updateData: any = { status: validated.status }

    if (validated.status === 'APPROVED') {
      updateData.approvedAt = new Date()
      updateData.approvedBy = session.user.id
    } else if (validated.status === 'PAID') {
      updateData.paidAt = new Date()
      // If not already approved, set approved too
      if (bonus.status !== 'APPROVED') {
        updateData.approvedAt = new Date()
        updateData.approvedBy = session.user.id
      }
    }

    const updated = await db.staffBonus.update({
      where: { id },
      data: updateData
    })

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      approvedAt: updated.approvedAt?.toISOString() || null,
      paidAt: updated.paidAt?.toISOString() || null
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating bonus status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
