import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

// GET - Fiyatlandırma analitiklerini getir
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const days = parseInt(searchParams.get('days') || '30', 10)

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Fiyat geçmişi analizi
    const priceHistory = await db.servicePriceHistory.findMany({
      where: {
        tenantId: session.user.tenantId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000
    })

    // Toplam istatistikler
    const totalAdjustments = priceHistory.length
    const avgAdjustment = priceHistory.length > 0
      ? priceHistory.reduce((acc, h) => acc + ((h.adjustedPrice - h.basePrice) / h.basePrice * 100), 0) / priceHistory.length
      : 0

    const increaseCount = priceHistory.filter(h => h.adjustedPrice > h.basePrice).length
    const decreaseCount = priceHistory.filter(h => h.adjustedPrice < h.basePrice).length
    const noChangeCount = priceHistory.filter(h => h.adjustedPrice === h.basePrice).length

    // Günlük dağılım
    const dailyStats: Record<string, { revenue: number; bookings: number; avgPrice: number }> = {}
    for (const item of priceHistory) {
      const date = item.createdAt.toISOString().split('T')[0]
      if (!dailyStats[date]) {
        dailyStats[date] = { revenue: 0, bookings: 0, avgPrice: 0 }
      }
      dailyStats[date].revenue += item.adjustedPrice
      dailyStats[date].bookings += 1
    }

    // Ortalama fiyat hesapla
    Object.keys(dailyStats).forEach(date => {
      const stat = dailyStats[date]
      stat.avgPrice = stat.bookings > 0 ? stat.revenue / stat.bookings : 0
    })

    return NextResponse.json({
      summary: {
        totalAdjustments,
        avgAdjustmentPercent: Math.round(avgAdjustment * 100) / 100,
        increaseCount,
        decreaseCount,
        noChangeCount
      },
      dailyStats: Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        ...stats
      })),
      recentHistory: priceHistory.slice(0, 50).map(h => ({
        id: h.id,
        basePrice: h.basePrice,
        adjustedPrice: h.adjustedPrice,
        adjustmentPercent: Math.round(((h.adjustedPrice - h.basePrice) / h.basePrice) * 100 * 100) / 100,
        bookingDate: h.bookingDate,
        startTime: h.startTime,
        occupancyRate: h.occupancyRate,
        createdAt: h.createdAt
      }))
    })
  } catch (error) {
    console.error('Error fetching pricing analytics:', error)
    return NextResponse.json({ error: 'Error fetching pricing analytics' }, { status: 500 })
  }
}
