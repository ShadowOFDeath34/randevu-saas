import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const featureFlagsSchema = z.object({
  aiFeaturesEnabled: z.boolean().optional(),
  enableAdvancedRouting: z.boolean().optional(),
  enableDynamicPricing: z.boolean().optional()
})

// GET - Get tenant feature flags
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        aiFeaturesEnabled: true,
        enableAdvancedRouting: true,
        enableDynamicPricing: true
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    return NextResponse.json({
      features: {
        aiFeatures: tenant.aiFeaturesEnabled,
        advancedRouting: tenant.enableAdvancedRouting,
        dynamicPricing: tenant.enableDynamicPricing
      }
    })
  } catch (error) {
    console.error('Error fetching feature flags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update tenant feature flags
export async function PATCH(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin/owner role
    if (!['owner', 'admin'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Only owners and admins can manage feature flags' },
        { status: 403 }
      )
    }

    const data = await request.json()
    const validated = featureFlagsSchema.parse(data)

    const updated = await db.tenant.update({
      where: { id: session.user.tenantId },
      data: validated,
      select: {
        aiFeaturesEnabled: true,
        enableAdvancedRouting: true,
        enableDynamicPricing: true
      }
    })

    return NextResponse.json({
      success: true,
      features: {
        aiFeatures: updated.aiFeaturesEnabled,
        advancedRouting: updated.enableAdvancedRouting,
        dynamicPricing: updated.enableDynamicPricing
      }
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('Error updating feature flags:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
