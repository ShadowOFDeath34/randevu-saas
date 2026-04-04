import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { getOrCreatePricingConfig, setupDefaultPricingRules } from '@/lib/pricing/service'

// GET - Fiyatlandırma konfigürasyonunu getir
export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const config = await getOrCreatePricingConfig(session.user.tenantId)

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching pricing config:', error)
    return NextResponse.json({ error: 'Error fetching pricing config' }, { status: 500 })
  }
}

// PUT - Konfigürasyonu güncelle
export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const {
      isEnabled,
      minAdjustmentPercent,
      maxAdjustmentPercent,
      useAiOptimization,
      autoSurgePricing,
      autoOffPeakDiscount,
      peakHoursStart,
      peakHoursEnd,
      highDemandThreshold,
      lowDemandThreshold,
      lastMinuteHours,
      advanceBookingDays
    } = body

    const config = await db.dynamicPricingConfig.update({
      where: { tenantId: session.user.tenantId },
      data: {
        isEnabled,
        minAdjustmentPercent,
        maxAdjustmentPercent,
        useAiOptimization,
        autoSurgePricing,
        autoOffPeakDiscount,
        peakHoursStart,
        peakHoursEnd,
        highDemandThreshold,
        lowDemandThreshold,
        lastMinuteHours,
        advanceBookingDays,
        updatedAt: new Date()
      }
    })

    // Eğer ilk kez aktif ediliyorsa varsayılan kuralları oluştur
    if (isEnabled) {
      await setupDefaultPricingRules(session.user.tenantId)
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error updating pricing config:', error)
    return NextResponse.json({ error: 'Error updating pricing config' }, { status: 500 })
  }
}
