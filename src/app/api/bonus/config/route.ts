import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// GET - Get bonus config
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await db.bonusConfig.findUnique({
      where: { tenantId: session.user.tenantId }
    })

    if (!config) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      id: config.id,
      isEnabled: config.isEnabled,
      defaultPeriod: config.defaultPeriod,
      calculationDay: config.calculationDay,
      baseBonusPercentage: config.baseBonusPercentage,
      minBookingCount: config.minBookingCount,
      minCustomerRating: config.minCustomerRating
    })
  } catch (error) {
    console.error('Error fetching bonus config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create or update bonus config
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    // Validation
    const schema = z.object({
      isEnabled: z.boolean().default(true),
      defaultPeriod: z.enum(['WEEKLY', 'MONTHLY', 'QUARTERLY']).default('MONTHLY'),
      calculationDay: z.number().min(1).max(31).default(1),
      baseBonusPercentage: z.number().min(0).max(100).default(5),
      minBookingCount: z.number().min(0).default(50),
      minCustomerRating: z.number().min(1).max(5).default(4.0)
    })

    const validated = schema.parse(data)

    // Upsert config
    const config = await db.bonusConfig.upsert({
      where: { tenantId: session.user.tenantId },
      update: validated,
      create: {
        tenantId: session.user.tenantId,
        ...validated
      }
    })

    return NextResponse.json({
      id: config.id,
      isEnabled: config.isEnabled,
      defaultPeriod: config.defaultPeriod,
      calculationDay: config.calculationDay,
      baseBonusPercentage: config.baseBonusPercentage,
      minBookingCount: config.minBookingCount,
      minCustomerRating: config.minCustomerRating
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error saving bonus config:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
