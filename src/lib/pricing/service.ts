import { db } from '@/lib/db'
import { PricingRuleType, PricingAdjustmentType, LoyaltyTier } from '@prisma/client'

// Dinamik fiyat hesaplama servisi
export interface PricingContext {
  serviceId: string
  staffId?: string
  bookingDate: string
  startTime: string
  customerId?: string
  tenantId: string
}

export interface CalculatedPrice {
  basePrice: number
  adjustedPrice: number
  adjustmentAmount: number
  adjustmentPercent: number
  appliedRules: string[]
  breakdown: PriceBreakdownItem[]
}

interface PriceBreakdownItem {
  ruleName: string
  adjustment: number
  type: 'increase' | 'decrease'
}

// Ana fiyat hesaplama fonksiyonu
export async function calculateDynamicPrice(
  context: PricingContext
): Promise<CalculatedPrice> {
  const { serviceId, staffId, bookingDate, startTime, customerId, tenantId } = context

  // Temel fiyatı al
  const service = await db.service.findFirst({
    where: { id: serviceId, tenantId }
  })

  if (!service || !service.price) {
    throw new Error('Service not found or has no base price')
  }

  const basePrice = service.price

  // Konfigürasyonu al
  const config = await getOrCreatePricingConfig(tenantId)

  if (!config.isEnabled) {
    return {
      basePrice,
      adjustedPrice: basePrice,
      adjustmentAmount: 0,
      adjustmentPercent: 0,
      appliedRules: [],
      breakdown: []
    }
  }

  // Aktif kuralları al
  const rules = await db.dynamicPricingRule.findMany({
    where: {
      tenantId,
      isActive: true,
      OR: [
        { serviceIds: { hasEvery: [] } },
        { serviceIds: { has: serviceId } }
      ]
    },
    orderBy: { priority: 'desc' }
  })

  // Doluluk oranını hesapla
  const occupancyRate = await calculateOccupancyRate(tenantId, bookingDate, startTime)

  // Müşteri sadakat seviyesini al
  let customerTier: LoyaltyTier | null = null
  if (customerId) {
    const customer = await db.customer.findFirst({
      where: { id: customerId, tenantId },
      select: { loyaltyTier: true }
    })
    customerTier = customer?.loyaltyTier || null
  }

  // Kuralları uygula
  let currentPrice = basePrice
  const appliedRules: string[] = []
  const breakdown: PriceBreakdownItem[] = []

  for (const rule of rules) {
    const shouldApply = await shouldApplyRule(rule, {
      bookingDate,
      startTime,
      occupancyRate,
      customerTier,
      staffId
    })

    if (shouldApply) {
      const newPrice = applyAdjustment(currentPrice, rule.adjustmentType, rule.adjustmentValue)
      const adjustment = newPrice - currentPrice

      if (adjustment !== 0) {
        breakdown.push({
          ruleName: rule.name,
          adjustment: Math.abs(adjustment),
          type: adjustment > 0 ? 'increase' : 'decrease'
        })
      }

      currentPrice = newPrice
      appliedRules.push(rule.id)
    }
  }

  // Min/max sınırları uygula
  const minPrice = basePrice * (1 + config.minAdjustmentPercent / 100)
  const maxPrice = basePrice * (1 + config.maxAdjustmentPercent / 100)
  currentPrice = Math.max(minPrice, Math.min(maxPrice, currentPrice))

  const adjustmentAmount = currentPrice - basePrice
  const adjustmentPercent = (adjustmentAmount / basePrice) * 100

  // Fiyat geçmişini kaydet
  await db.servicePriceHistory.create({
    data: {
      tenantId,
      serviceId,
      basePrice,
      adjustedPrice: currentPrice,
      adjustmentReason: appliedRules.join(','),
      appliedRules,
      bookingDate,
      startTime,
      occupancyRate
    }
  })

  return {
    basePrice,
    adjustedPrice: currentPrice,
    adjustmentAmount,
    adjustmentPercent,
    appliedRules,
    breakdown
  }
}

// Konfigürasyon al veya oluştur
export async function getOrCreatePricingConfig(tenantId: string) {
  let config = await db.dynamicPricingConfig.findUnique({
    where: { tenantId }
  })

  if (!config) {
    config = await db.dynamicPricingConfig.create({
      data: {
        tenantId,
        isEnabled: false
      }
    })
  }

  return config
}

// Doluluk oranı hesapla
async function calculateOccupancyRate(
  tenantId: string,
  bookingDate: string,
  startTime: string
): Promise<number> {
  const startOfDay = new Date(`${bookingDate}T00:00:00`)
  const endOfDay = new Date(`${bookingDate}T23:59:59`)

  // O günün toplam kapasitesi (tüm personellerin çalışma saatleri)
  const staffHours = await db.staffWorkingHour.findMany({
    where: {
      staff: { tenantId, isActive: true },
      dayOfWeek: startOfDay.getDay()
    }
  })

  const totalCapacity = staffHours.reduce((acc, wh) => {
    if (wh.isClosed || !wh.openTime || !wh.closeTime) return acc
    const open = parseInt(wh.openTime.split(':')[0])
    const close = parseInt(wh.closeTime.split(':')[0])
    return acc + (close - open)
  }, 0)

  // O günkü toplam randevular
  const bookings = await db.booking.count({
    where: {
      tenantId,
      bookingDate,
      status: { notIn: ['cancelled', 'no_show'] },
      deletedAt: null
    }
  })

  if (totalCapacity === 0) return 0

  return Math.min(100, Math.round((bookings / totalCapacity) * 100))
}

// Kural uygulanmalı mı?
async function shouldApplyRule(
  rule: any,
  context: {
    bookingDate: string
    startTime: string
    occupancyRate: number
    customerTier: LoyaltyTier | null
    staffId?: string
  }
): Promise<boolean> {
  const { bookingDate, startTime, occupancyRate, customerTier, staffId } = context

  // Personel filtresi
  if (rule.staffIds?.length > 0 && staffId && !rule.staffIds.includes(staffId)) {
    return false
  }

  // Tarih aralığı kontrolü
  if (rule.startDate && new Date(bookingDate) < new Date(rule.startDate)) {
    return false
  }
  if (rule.endDate && new Date(bookingDate) > new Date(rule.endDate)) {
    return false
  }

  // Gün kontrolü
  if (rule.daysOfWeek?.length > 0) {
    const dayOfWeek = new Date(`${bookingDate}T00:00:00`).getDay()
    if (!rule.daysOfWeek.includes(dayOfWeek)) {
      return false
    }
  }

  // Saat kontrolü
  if (rule.startTime && rule.endTime) {
    if (startTime < rule.startTime || startTime >= rule.endTime) {
      return false
    }
  }

  // Doluluk kontrolü
  if (rule.minOccupancy !== null && occupancyRate < rule.minOccupancy) {
    return false
  }
  if (rule.maxOccupancy !== null && occupancyRate > rule.maxOccupancy) {
    return false
  }

  // Sadakat seviyesi kontrolü
  if (rule.minLoyaltyTier && customerTier) {
    const tiers = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM']
    if (tiers.indexOf(customerTier) < tiers.indexOf(rule.minLoyaltyTier)) {
      return false
    }
  }

  return true
}

// Fiyat ayarlaması uygula
function applyAdjustment(
  currentPrice: number,
  adjustmentType: PricingAdjustmentType,
  adjustmentValue: number
): number {
  switch (adjustmentType) {
    case 'PERCENTAGE_INCREASE':
      return currentPrice * (1 + adjustmentValue / 100)
    case 'PERCENTAGE_DECREASE':
      return currentPrice * (1 - adjustmentValue / 100)
    case 'FIXED_AMOUNT':
      return currentPrice + adjustmentValue
    case 'FIXED_PRICE':
      return adjustmentValue
    default:
      return currentPrice
  }
}

// AI Fiyat önerisi (basit bir algoritma)
export async function getAIRecommendedPrice(
  tenantId: string,
  serviceId: string,
  bookingDate: string,
  startTime: string
): Promise<{ recommendedPrice: number; confidence: number; reason: string }> {
  const service = await db.service.findFirst({
    where: { id: serviceId, tenantId }
  })

  if (!service || !service.price) {
    throw new Error('Service not found')
  }

  // Geçmiş verileri analiz et
  const history = await db.servicePriceHistory.findMany({
    where: {
      tenantId,
      serviceId,
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Son 30 gün
    },
    orderBy: { createdAt: 'desc' },
    take: 100
  })

  const occupancyRate = await calculateOccupancyRate(tenantId, bookingDate, startTime)

  // Basit AI mantığı: Doluluk ve geçmiş verilere göre
  let recommendation = service.price
  let reason = ''

  if (occupancyRate > 80) {
    recommendation = service.price * 1.15
    reason = 'Yoğun talep: Fiyat %15 artırılabilir'
  } else if (occupancyRate < 30) {
    recommendation = service.price * 0.85
    reason = 'Düşük talep: Fiyat %15 indirilebilir'
  } else {
    recommendation = service.price
    reason = 'Normal talep: Standart fiyat önerilir'
  }

  // Geçmiş başarı oranı
  const successfulBookings = history.filter(h => h.adjustedPrice > 0).length
  const confidence = history.length > 0 ? successfulBookings / history.length : 0.5

  return {
    recommendedPrice: Math.round(recommendation),
    confidence: Math.round(confidence * 100),
    reason
  }
}

// Otomatik kuralları oluştur (ilk kurulum için)
export async function setupDefaultPricingRules(tenantId: string) {
  const config = await getOrCreatePricingConfig(tenantId)

  if (!config.isEnabled) return

  // Mevcut kuralları kontrol et
  const existingRules = await db.dynamicPricingRule.count({
    where: { tenantId }
  })

  if (existingRules > 0) return // Zaten kurallar var

  // Varsayılan kuralları oluştur
  const defaultRules = [
    {
      name: 'Yoğun Saat Artışı',
      description: '17:00-20:00 arası yoğun saatlerde %10 artış',
      ruleType: PricingRuleType.SURGE_PEAK_HOURS,
      adjustmentType: PricingAdjustmentType.PERCENTAGE_INCREASE,
      adjustmentValue: 10,
      startTime: '17:00',
      endTime: '20:00',
      daysOfWeek: [1, 2, 3, 4, 5], // Hafta içi
      priority: 10
    },
    {
      name: 'Öğle İndirimi',
      description: '11:00-14:00 arası %10 indirim',
      ruleType: PricingRuleType.DISCOUNT_OFF_PEAK,
      adjustmentType: PricingAdjustmentType.PERCENTAGE_DECREASE,
      adjustmentValue: 10,
      startTime: '11:00',
      endTime: '14:00',
      daysOfWeek: [1, 2, 3, 4, 5, 6],
      priority: 5
    },
    {
      name: 'Son Dakika İndirimi',
      description: '24 saat içindeki boş slotlara %15 indirim',
      ruleType: PricingRuleType.LAST_MINUTE,
      adjustmentType: PricingAdjustmentType.PERCENTAGE_DECREASE,
      adjustmentValue: 15,
      priority: 8
    },
    {
      name: 'Erken Rezervasyon',
      description: '7+ gün önceden rezervasyona %5 indirim',
      ruleType: PricingRuleType.ADVANCE_BOOKING,
      adjustmentType: PricingAdjustmentType.PERCENTAGE_DECREASE,
      adjustmentValue: 5,
      priority: 3
    },
    {
      name: 'Gold Müşteri İndirimi',
      description: 'Gold ve üstü müşterilere %10 indirim',
      ruleType: PricingRuleType.LOYALTY_BONUS,
      adjustmentType: PricingAdjustmentType.PERCENTAGE_DECREASE,
      adjustmentValue: 10,
      minLoyaltyTier: 'GOLD' as LoyaltyTier,
      priority: 20
    }
  ]

  for (const rule of defaultRules) {
    await db.dynamicPricingRule.create({
      data: {
        tenantId,
        ...rule
      }
    })
  }
}
