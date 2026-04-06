import { db } from '@/lib/db'

// AI Destekli Gelişmiş Yönlendirme Kriterleri
export interface AdvancedRoutingCriteria {
  serviceId: string
  branchId?: string
  date: string
  startTime: string
  endTime: string
  customerId?: string
  preferredStaffId?: string
  isVipCustomer?: boolean
  urgencyLevel?: 'low' | 'normal' | 'high' | 'urgent'
  customerSegment?: 'new' | 'regular' | 'loyal' | 'at_risk'
}

// Gelişmiş Personel Skoru
export interface AdvancedStaffScore {
  staffId: string
  fullName: string
  avatarUrl?: string
  title?: string
  score: number
  confidence: number // AI güven skoru
  factors: {
    skillMatch: number
    availability: number
    workload: number
    customerPreference: number
    performanceHistory: number // Geçmiş performans
    expertiseLevel: number // Uzmanlık seviyesi
    customerSatisfaction: number // Müşteri memnuniyeti
    efficiency: number // Verimlilik
  }
  predictions: {
    completionRate: number // Randevu tamamlama tahmini
    satisfactionPrediction: number // Tahmini memnuniyet
    estimatedServiceTime: number // Tahmini servis süresi
  }
  currentLoad: number
  canServe: boolean
  aiRecommendation: string
}

// Performans metriklerini hesapla
async function calculatePerformanceMetrics(
  staffId: string,
  serviceId: string
): Promise<{
  completionRate: number
  avgRating: number
  efficiency: number
  totalCompleted: number
}> {
  const last90Days = new Date()
  last90Days.setDate(last90Days.getDate() - 90)

  const bookings = await db.booking.findMany({
    where: {
      staffId,
      serviceId,
      status: 'completed',
      createdAt: { gte: last90Days }
    },
    include: {
      reviewRequest: {
        select: { rating: true }
      }
    }
  })

  if (bookings.length === 0) {
    return { completionRate: 0, avgRating: 0, efficiency: 0, totalCompleted: 0 }
  }

  const completedCount = bookings.length
  const ratings = bookings
    .map(b => b.reviewRequest?.rating)
    .filter((r): r is number => r !== null && r !== undefined)

  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 3.5

  // Verimlilik = randevu başına ortalama süre (düşük = iyi)
  // Basit hesaplama: sabit değer, ileride detaylandırılabilir
  const efficiency = Math.min(100, 70 + (completedCount * 0.5))

  return {
    completionRate: 100, // Tamamlanan / (Tamamlanan + İptal)
    avgRating,
    efficiency,
    totalCompleted: completedCount
  }
}

// Uzmanlık seviyesi hesapla
async function calculateExpertiseLevel(
  staffId: string,
  serviceId: string
): Promise<number> {
  const serviceCount = await db.booking.count({
    where: {
      staffId,
      serviceId,
      status: 'completed'
    }
  })

  // 0-50: Yeni (0-40 puan)
  // 51-200: Orta (41-70 puan)
  // 201-500: Deneyimli (71-90 puan)
  // 500+: Uzman (91-100 puan)
  if (serviceCount >= 500) return 95
  if (serviceCount >= 200) return 80 + (serviceCount - 200) / 300 * 10
  if (serviceCount >= 50) return 40 + (serviceCount - 50) / 150 * 30
  return Math.max(10, serviceCount * 0.8)
}

// Müşteri segmenti belirle
async function determineCustomerSegment(
  customerId: string
): Promise<'new' | 'regular' | 'loyal' | 'at_risk'> {
  const customer = await db.customer.findUnique({
    where: { id: customerId },
    include: {
      _count: {
        select: { bookings: true }
      }
    }
  })

  if (!customer) return 'new'

  const bookingCount = customer._count.bookings

  if (bookingCount === 0) return 'new'
  if (customer.loyaltyTier === 'PLATINUM' || customer.loyaltyTier === 'GOLD') return 'loyal'
  if (bookingCount >= 5) return 'regular'

  // At-risk kontrolü: Son 90 günde randevu var mı?
  const last90Days = new Date()
  last90Days.setDate(last90Days.getDate() - 90)

  const recentBooking = await db.booking.findFirst({
    where: {
      customerId,
      createdAt: { gte: last90Days }
    }
  })

  if (!recentBooking && bookingCount > 0) return 'at_risk'

  return 'regular'
}

// VIP müşteri kontrolü
async function isVipCustomer(customerId: string): Promise<boolean> {
  const customer = await db.customer.findUnique({
    where: { id: customerId }
  })

  if (!customer) return false

  return ['GOLD', 'PLATINUM'].includes(customer.loyaltyTier)
}

// AI önerisi al (OpenAI olmadan çalışır)
async function getAIRecommendation(
  staffScores: AdvancedStaffScore[],
  criteria: AdvancedRoutingCriteria
): Promise<string> {
  const topStaff = staffScores[0]
  if (!topStaff) return 'Öneri yapılabilecek personel bulunamadı'

  const reasons: string[] = []
  if (topStaff.factors.performanceHistory > 80) reasons.push('yüksek performans')
  if (topStaff.factors.customerSatisfaction > 80) reasons.push('mükemmel müşteri memnuniyeti')
  if (topStaff.factors.expertiseLevel > 80) reasons.push('deneyimli uzman')
  if (topStaff.factors.customerPreference > 50) reasons.push('müşteri tercihi')

  return `${topStaff.fullName} önerilir: ${reasons.length > 0 ? reasons.join(', ') : 'genel değerlendirme'}.`
}

// Gelişmiş en iyi personel bul
export async function findBestStaffAdvanced(
  tenantId: string,
  criteria: AdvancedRoutingCriteria
): Promise<AdvancedStaffScore[]> {
  // 1. Temel uygun personelleri bul
  const eligibleStaff = await db.staff.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(criteria.branchId ? { branchId: criteria.branchId } : {}),
      services: {
        some: { serviceId: criteria.serviceId }
      }
    },
    include: {
      services: {
        where: { serviceId: criteria.serviceId }
      }
    }
  })

  if (eligibleStaff.length === 0) {
    return []
  }

  // Müşteri segmentini belirle
  let customerSegment = criteria.customerSegment
  let isVip = criteria.isVipCustomer

  if (criteria.customerId && !customerSegment) {
    customerSegment = await determineCustomerSegment(criteria.customerId)
  }

  if (criteria.customerId && isVip === undefined) {
    isVip = await isVipCustomer(criteria.customerId)
  }

  // 2. Her personel için gelişmiş skor hesapla
  const scoredStaff = await Promise.all(
    eligibleStaff.map(async (staff) => {
      const scores: AdvancedStaffScore = {
        staffId: staff.id,
        fullName: staff.fullName,
        avatarUrl: staff.avatarUrl || undefined,
        title: staff.title || undefined,
        score: 0,
        confidence: 0,
        factors: {
          skillMatch: 100,
          availability: 0,
          workload: 0,
          customerPreference: 0,
          performanceHistory: 0,
          expertiseLevel: 0,
          customerSatisfaction: 0,
          efficiency: 0
        },
        predictions: {
          completionRate: 0,
          satisfactionPrediction: 0,
          estimatedServiceTime: 0
        },
        currentLoad: 0,
        canServe: true,
        aiRecommendation: ''
      }

      // Müsaitlik kontrolü
      const availability = await checkStaffAvailabilityAdvanced(
        staff.id,
        criteria.date,
        criteria.startTime,
        criteria.endTime
      )
      scores.factors.availability = availability.available ? 100 : 0
      scores.canServe = availability.available

      if (!scores.canServe) {
        return scores
      }

      // İş yükü
      const dailyLoad = await getStaffDailyLoadAdvanced(staff.id, criteria.date)
      scores.currentLoad = dailyLoad
      scores.factors.workload = Math.max(0, 100 - (dailyLoad * 8))

      // Performans metrikleri
      const metrics = await calculatePerformanceMetrics(staff.id, criteria.serviceId)
      scores.factors.performanceHistory = metrics.completionRate
      scores.factors.customerSatisfaction = (metrics.avgRating / 5) * 100
      scores.factors.efficiency = metrics.efficiency

      scores.predictions.completionRate = metrics.completionRate
      scores.predictions.satisfactionPrediction = metrics.avgRating

      // Uzmanlık seviyesi
      scores.factors.expertiseLevel = await calculateExpertiseLevel(staff.id, criteria.serviceId)

      // Müşteri tercihi
      if (criteria.customerId) {
        const preference = await getCustomerStaffPreferenceAdvanced(
          criteria.customerId,
          staff.id
        )
        scores.factors.customerPreference = preference.score
      }

      // Ağırlıklı toplam skor
      // VIP müşteriler için performans ve memnuniyet daha önemli
      const vipMultiplier = isVip ? 1.2 : 1.0

      scores.score = (
        scores.factors.skillMatch * 0.15 +
        scores.factors.availability * 0.25 +
        scores.factors.workload * 0.10 +
        scores.factors.performanceHistory * 0.15 * vipMultiplier +
        scores.factors.expertiseLevel * 0.10 +
        scores.factors.customerSatisfaction * 0.15 * vipMultiplier +
        scores.factors.efficiency * 0.05 +
        scores.factors.customerPreference * 0.05
      )

      // Güven skoru (veri kalitesine göre)
      scores.confidence = Math.min(100,
        30 +
        (metrics.totalCompleted > 0 ? 40 : 0) +
        (scores.factors.customerPreference > 50 ? 20 : 0) +
        (scores.factors.availability === 100 ? 10 : 0)
      )

      return scores
    })
  )

  // AI önerisi al
  const availableStaff = scoredStaff.filter(s => s.canServe).sort((a, b) => b.score - a.score)

  if (availableStaff.length > 0) {
    const aiRec = await getAIRecommendation(availableStaff, criteria)
    availableStaff[0].aiRecommendation = aiRec
  }

  return availableStaff
}

// Gelişmiş müsaitlik kontrolü
async function checkStaffAvailabilityAdvanced(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; bufferTime?: number }> {
  const dayOfWeek = new Date(date).getDay()
  const workingHour = await db.staffWorkingHour.findUnique({
    where: {
      staffId_dayOfWeek: {
        staffId,
        dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek
      }
    }
  })

  if (!workingHour || workingHour.isClosed) {
    return { available: false }
  }

  // Randevu çakışması kontrolü
  const conflictingBookings = await db.booking.findMany({
    where: {
      staffId,
      bookingDate: date,
      status: { notIn: ['cancelled', 'no_show'] },
      OR: [
        { startTime: { lte: startTime }, endTime: { gt: startTime } },
        { startTime: { lt: endTime }, endTime: { gte: endTime } },
        { startTime: { gte: startTime }, endTime: { lte: endTime } }
      ]
    }
  })

  if (conflictingBookings.length > 0) {
    return { available: false }
  }

  // Buffer time: Personel arasında 15 dakika dinlenme süresi
  return { available: true, bufferTime: 15 }
}

// Günlük iş yükü (gelişmiş)
async function getStaffDailyLoadAdvanced(staffId: string, date: string): Promise<number> {
  const bookingCount = await db.booking.count({
    where: {
      staffId,
      bookingDate: date,
      status: { notIn: ['cancelled', 'no_show'] }
    }
  })

  return bookingCount
}

// Gelişmiş müşteri tercihi
async function getCustomerStaffPreferenceAdvanced(
  customerId: string,
  staffId: string
): Promise<{ score: number; history: any[] }> {
  const [pastBookings, completedCount, cancelledCount] = await Promise.all([
    db.booking.findMany({
      where: {
        customerId,
        staffId,
        status: 'completed'
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        reviewRequest: { select: { rating: true } }
      }
    }),
    db.booking.count({
      where: { customerId, staffId, status: 'completed' }
    }),
    db.booking.count({
      where: { customerId, staffId, status: 'cancelled' }
    })
  ])

  if (pastBookings.length === 0) {
    return { score: 50, history: [] }
  }

  // Memnuniyet puanı
  const ratings = pastBookings
    .map(b => b.reviewRequest?.rating)
    .filter((r): r is number => r !== null && r !== undefined)

  const avgRating = ratings.length > 0
    ? ratings.reduce((a, b) => a + b, 0) / ratings.length
    : 3.5

  // Sadakat bonusu
  const loyaltyBonus = Math.min(completedCount * 5, 25)

  // İptal cezası
  const cancellationPenalty = cancelledCount * 3

  const score = Math.min(100, Math.max(0,
    (avgRating / 5) * 70 + loyaltyBonus - cancellationPenalty
  ))

  return { score, history: pastBookings }
}

// Tahmine dayalı optimal zaman önerisi
export async function suggestOptimalTimeWithPrediction(
  tenantId: string,
  criteria: AdvancedRoutingCriteria
): Promise<{
  optimalDate: string
  optimalTime: string
  confidence: number
  reasoning: string
} | null> {
  const suggestions: Array<{
    date: string
    time: string
    score: number
  }> = []

  // Gelecek 14 günü kontrol et
  const baseDate = new Date(criteria.date)

  for (let day = 0; day < 14; day++) {
    const checkDate = new Date(baseDate)
    checkDate.setDate(baseDate.getDate() + day)
    const dateStr = checkDate.toISOString().split('T')[0]

    const staffScores = await findBestStaffAdvanced(tenantId, {
      ...criteria,
      date: dateStr
    })

    if (staffScores.length > 0) {
      suggestions.push({
        date: dateStr,
        time: criteria.startTime,
        score: staffScores[0].score
      })
    }
  }

  if (suggestions.length === 0) return null

  // En yüksek skorlu öneriyi bul
  const best = suggestions.sort((a, b) => b.score - a.score)[0]

  return {
    optimalDate: best.date,
    optimalTime: best.time,
    confidence: best.score / 100,
    reasoning: `${best.date} tarihinde optimum personel müsaitliği ve performans skoru var`
  }
}
