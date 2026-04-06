import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NextResponse } from 'next/server'
import { findBestStaffAdvanced, suggestOptimalTimeWithPrediction } from '@/lib/routing/ai-router'
import { z } from 'zod'

const suggestSchema = z.object({
  serviceId: z.string(),
  branchId: z.string().optional(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  customerId: z.string().optional(),
  preferredStaffId: z.string().optional(),
  urgencyLevel: z.enum(['low', 'normal', 'high', 'urgent']).optional(),
  suggestAlternatives: z.boolean().default(true)
})

// POST - AI-powered staff suggestions
export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const validated = suggestSchema.parse(data)

    // Get tenant config for AI features
    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        aiFeaturesEnabled: true,
        enableAdvancedRouting: true
      }
    })

    if (!tenant?.enableAdvancedRouting) {
      return NextResponse.json(
        { error: 'Advanced routing is not enabled' },
        { status: 400 }
      )
    }

    // Get service details for duration calculation
    const service = await db.service.findFirst({
      where: {
        id: validated.serviceId,
        tenantId: session.user.tenantId
      },
      select: { durationMinutes: true, name: true }
    })

    if (!service) {
      return NextResponse.json(
        { error: 'Service not found' },
        { status: 404 }
      )
    }

    // Calculate end time if not provided
    const endTime = validated.endTime || calculateEndTime(validated.startTime, service.durationMinutes)

    // Get AI-powered staff suggestions
    const staffScores = await findBestStaffAdvanced(
      session.user.tenantId,
      {
        serviceId: validated.serviceId,
        branchId: validated.branchId,
        date: validated.date,
        startTime: validated.startTime,
        endTime: endTime,
        customerId: validated.customerId,
        preferredStaffId: validated.preferredStaffId,
        urgencyLevel: validated.urgencyLevel
      }
    )

    // Get alternative time suggestions if requested and no ideal staff found
    let alternatives = null
    if (validated.suggestAlternatives && staffScores.length === 0) {
      alternatives = await suggestOptimalTimeWithPrediction(
        session.user.tenantId,
        {
          serviceId: validated.serviceId,
          branchId: validated.branchId,
          date: validated.date,
          startTime: validated.startTime,
          endTime: endTime,
          customerId: validated.customerId
        }
      )
    }

    return NextResponse.json({
      success: true,
      service: {
        id: validated.serviceId,
        name: service.name,
        durationMinutes: service.durationMinutes
      },
      suggestions: staffScores.map(s => ({
        staffId: s.staffId,
        fullName: s.fullName,
        avatarUrl: s.avatarUrl,
        title: s.title,
        score: Math.round(s.score * 10) / 10,
        confidence: Math.round(s.confidence),
        isRecommended: s.aiRecommendation ? true : false,
        aiReasoning: s.aiRecommendation,
        factors: s.factors,
        predictions: s.predictions,
        currentLoad: s.currentLoad
      })),
      recommendedStaff: staffScores.length > 0 ? staffScores[0].staffId : null,
      alternativeTime: alternatives,
      totalAvailable: staffScores.filter(s => s.canServe).length
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      )
    }
    console.error('AI routing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const totalMinutes = hours * 60 + minutes + durationMinutes
  const endHours = Math.floor(totalMinutes / 60)
  const endMinutes = totalMinutes % 60
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`
}
