import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

type BonusPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
type BonusStatus = 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED'

// Performans yapılandırması getir
export async function getPerformanceConfig(tenantId: string) {
  return db.staffPerformanceConfig.findUnique({
    where: { tenantId }
  })
}

// Performans yapılandırması oluştur/güncelle
export async function upsertPerformanceConfig(data: {
  tenantId: string
  isEnabled?: boolean
  defaultPeriod: BonusPeriod
  calculationDay?: number
  baseBonusPercentage?: number
  minBookingCount?: number
  minCustomerRating?: number
}) {
  return db.staffPerformanceConfig.upsert({
    where: { tenantId: data.tenantId },
    update: {
      isEnabled: data.isEnabled,
      defaultPeriod: data.defaultPeriod,
      calculationDay: data.calculationDay,
      baseBonusPercentage: data.baseBonusPercentage,
      minBookingCount: data.minBookingCount,
      minCustomerRating: data.minCustomerRating
    },
    create: {
      tenantId: data.tenantId,
      isEnabled: data.isEnabled ?? true,
      defaultPeriod: data.defaultPeriod,
      calculationDay: data.calculationDay ?? 1,
      baseBonusPercentage: data.baseBonusPercentage ?? 5,
      minBookingCount: data.minBookingCount ?? 50,
      minCustomerRating: data.minCustomerRating ?? 4.0
    }
  })
}

// Personel hedeflerini getir
export async function getStaffBonusTargets(staffId: string) {
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1

  return db.staffBonusTarget.findMany({
    where: {
      staffId,
      year: currentYear,
      month: currentMonth
    }
  })
}

// Personel hedefi oluştur/güncelle
export async function upsertBonusTarget(data: {
  tenantId: string
  staffId: string
  period: BonusPeriod
  year: number
  month?: number
  week?: number
  quarter?: number
  targetBookingCount?: number
  targetRevenue?: number
  targetCustomerRating?: number
  targetUpsellRate?: number
  calculationType?: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'TIERED'
  baseAmount?: number
  percentageRate?: number
  isActive?: boolean
}) {
  // Önce mevcut kaydı bulmaya çalış
  const existing = await db.staffBonusTarget.findFirst({
    where: {
      staffId: data.staffId,
      period: data.period,
      year: data.year,
      month: data.month,
      week: data.week,
      quarter: data.quarter
    }
  })

  if (existing) {
    return db.staffBonusTarget.update({
      where: { id: existing.id },
      data: {
        targetBookingCount: data.targetBookingCount,
        targetRevenue: data.targetRevenue,
        targetCustomerRating: data.targetCustomerRating,
        targetUpsellRate: data.targetUpsellRate,
        calculationType: data.calculationType,
        baseAmount: data.baseAmount,
        percentageRate: data.percentageRate,
        isActive: data.isActive
      }
    })
  }

  return db.staffBonusTarget.create({
    data: {
      tenantId: data.tenantId,
      staffId: data.staffId,
      period: data.period,
      year: data.year,
      month: data.month,
      week: data.week,
      quarter: data.quarter,
      targetBookingCount: data.targetBookingCount ?? 0,
      targetRevenue: data.targetRevenue ?? 0,
      targetCustomerRating: data.targetCustomerRating ?? 0,
      targetUpsellRate: data.targetUpsellRate ?? 0,
      calculationType: data.calculationType || 'TIERED',
      baseAmount: data.baseAmount ?? 0,
      percentageRate: data.percentageRate ?? 0,
      isActive: data.isActive ?? true
    }
  })
}

// Performans log kaydet
export async function logStaffPerformance(data: {
  tenantId: string
  staffId: string
  date: string // "2025-01-15"
  bookingsCompleted?: number
  bookingsCancelled?: number
  revenueGenerated?: number
  customersServed?: number
  averageRating?: number
  upsellAmount?: number
  hoursWorked?: number
  isPresent?: boolean
}) {
  return db.staffPerformanceLog.upsert({
    where: {
      staffId_date: {
        staffId: data.staffId,
        date: data.date
      }
    },
    update: {
      bookingsCompleted: data.bookingsCompleted,
      bookingsCancelled: data.bookingsCancelled,
      revenueGenerated: data.revenueGenerated,
      customersServed: data.customersServed,
      averageRating: data.averageRating,
      upsellAmount: data.upsellAmount,
      hoursWorked: data.hoursWorked,
      isPresent: data.isPresent
    },
    create: {
      tenantId: data.tenantId,
      staffId: data.staffId,
      date: data.date,
      bookingsCompleted: data.bookingsCompleted ?? 0,
      bookingsCancelled: data.bookingsCancelled ?? 0,
      revenueGenerated: data.revenueGenerated ?? 0,
      customersServed: data.customersServed ?? 0,
      averageRating: data.averageRating,
      upsellAmount: data.upsellAmount ?? 0,
      hoursWorked: data.hoursWorked ?? 0,
      isPresent: data.isPresent ?? true
    }
  })
}

// Dönem başlangıç/bitiş bilgilerini hesapla
function getPeriodInfo(period: BonusPeriod, referenceDate: Date = new Date()) {
  const year = referenceDate.getFullYear()
  const month = referenceDate.getMonth() + 1
  const day = referenceDate.getDate()

  let periodMonth: number | undefined
  let periodWeek: number | undefined
  let periodQuarter: number | undefined

  switch (period) {
    case 'WEEKLY':
      // Hafta numarası hesapla (basitleştirilmiş)
      const startOfYear = new Date(year, 0, 1)
      const pastDays = Math.floor((referenceDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
      periodWeek = Math.ceil((pastDays + startOfYear.getDay() + 1) / 7)
      break

    case 'MONTHLY':
      periodMonth = month
      break

    case 'QUARTERLY':
      periodQuarter = Math.ceil(month / 3)
      break
  }

  return { year, month: periodMonth, week: periodWeek, quarter: periodQuarter }
}

// Performans metriklerini hesapla
export async function calculateStaffMetrics(
  staffId: string,
  tenantId: string,
  startDate: string,
  endDate: string
) {
  const logs = await db.staffPerformanceLog.findMany({
    where: {
      staffId,
      tenantId,
      date: { gte: startDate, lte: endDate }
    }
  })

  const totals = logs.reduce(
    (acc, log) => ({
      bookingsCompleted: acc.bookingsCompleted + (log.bookingsCompleted || 0),
      bookingsCancelled: acc.bookingsCancelled + (log.bookingsCancelled || 0),
      revenueGenerated: acc.revenueGenerated + (log.revenueGenerated || 0),
      customersServed: acc.customersServed + (log.customersServed || 0),
      averageRatingSum: acc.averageRatingSum + (log.averageRating || 0),
      ratingCount: acc.ratingCount + (log.averageRating ? 1 : 0),
      upsellAmount: acc.upsellAmount + (log.upsellAmount || 0),
      hoursWorked: acc.hoursWorked + (log.hoursWorked || 0)
    }),
    {
      bookingsCompleted: 0,
      bookingsCancelled: 0,
      revenueGenerated: 0,
      customersServed: 0,
      averageRatingSum: 0,
      ratingCount: 0,
      upsellAmount: 0,
      hoursWorked: 0
    }
  )

  return {
    bookingsCompleted: totals.bookingsCompleted,
    bookingsCancelled: totals.bookingsCancelled,
    revenueGenerated: totals.revenueGenerated,
    customersServed: totals.customersServed,
    averageRating: totals.ratingCount > 0 ? totals.averageRatingSum / totals.ratingCount : 0,
    upsellRate: totals.revenueGenerated > 0 ? (totals.upsellAmount / totals.revenueGenerated) * 100 : 0,
    hoursWorked: totals.hoursWorked
  }
}

// Bonus hesapla
export async function calculateBonus(
  staffId: string,
  tenantId: string,
  period: BonusPeriod,
  referenceDate: Date = new Date()
) {
  const config = await getPerformanceConfig(tenantId)
  if (!config) {
    throw new Error('Performans yapılandırması bulunamadı')
  }

  const periodInfo = getPeriodInfo(period, referenceDate)

  // Hedefi bul
  const target = await db.staffBonusTarget.findFirst({
    where: {
      staffId,
      tenantId,
      period,
      year: periodInfo.year,
      month: periodInfo.month,
      week: periodInfo.week,
      quarter: periodInfo.quarter,
      isActive: true
    }
  })

  if (!target) {
    throw new Error('Hedef bulunamadı')
  }

  // Tarih aralığını belirle
  let startDate: string
  let endDate: string
  const year = periodInfo.year

  switch (period) {
    case 'WEEKLY':
      // Basitleştirilmiş: yılın X. haftası
      const weekStart = new Date(year, 0, 1 + (periodInfo.week! - 1) * 7)
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)
      startDate = weekStart.toISOString().split('T')[0]
      endDate = weekEnd.toISOString().split('T')[0]
      break

    case 'MONTHLY':
      const monthStart = new Date(year, periodInfo.month! - 1, 1)
      const monthEnd = new Date(year, periodInfo.month!, 0)
      startDate = monthStart.toISOString().split('T')[0]
      endDate = monthEnd.toISOString().split('T')[0]
      break

    case 'QUARTERLY':
      const quarterStart = new Date(year, (periodInfo.quarter! - 1) * 3, 1)
      const quarterEnd = new Date(year, periodInfo.quarter! * 3, 0)
      startDate = quarterStart.toISOString().split('T')[0]
      endDate = quarterEnd.toISOString().split('T')[0]
      break

    default:
      const defaultStart = new Date(year, 0, 1)
      const defaultEnd = new Date(year, 11, 31)
      startDate = defaultStart.toISOString().split('T')[0]
      endDate = defaultEnd.toISOString().split('T')[0]
  }

  // Metrikleri hesapla
  const metrics = await calculateStaffMetrics(staffId, tenantId, startDate, endDate)

  // Mevcut bonus kaydını kontrol et
  const existingBonus = await db.staffBonus.findFirst({
    where: {
      staffId,
      period,
      year: periodInfo.year,
      month: periodInfo.month,
      week: periodInfo.week
    }
  })

  if (existingBonus?.status === 'PAID') {
    throw new Error('Bu dönem için bonus zaten ödenmiş')
  }

  // Bonus hesapla
  let calculatedBonus = 0
  const bonusPercentage = target.percentageRate || config.baseBonusPercentage || 5

  // Minimum koşulları kontrol et
  const minBookingCount = config.minBookingCount || 0
  const minCustomerRating = config.minCustomerRating || 0

  if (metrics.bookingsCompleted >= minBookingCount &&
      metrics.averageRating >= minCustomerRating) {
    // Gelirin yüzdesi olarak hesapla
    calculatedBonus = (metrics.revenueGenerated * bonusPercentage) / 100
  }

  // Bonus kaydını oluştur/güncelle
  const bonusData = {
    tenantId,
    staffId,
    targetId: target.id,
    period,
    year: periodInfo.year,
    month: periodInfo.month,
    week: periodInfo.week,
    quarter: periodInfo.quarter,
    actualBookingCount: metrics.bookingsCompleted,
    actualRevenue: metrics.revenueGenerated,
    actualCustomerRating: metrics.averageRating,
    actualUpsellRate: metrics.upsellRate,
    actualAttendanceRate: metrics.hoursWorked > 0 ? 100 : 0,
    calculatedBonus,
    bonusPercentage,
    status: 'CALCULATED' as BonusStatus
  }

  if (existingBonus) {
    return db.staffBonus.update({
      where: { id: existingBonus.id },
      data: bonusData
    })
  }

  return db.staffBonus.create({
    data: bonusData
  })
}

// Bonus durumunu güncelle
export async function updateBonusStatus(
  bonusId: string,
  status: BonusStatus,
  notes?: string
) {
  const data: any = { status }

  if (status === 'APPROVED') {
    data.approvedAt = new Date()
  }
  if (status === 'PAID') {
    data.paidAt = new Date()
  }
  if (notes) {
    data.notes = notes
  }

  return db.staffBonus.update({
    where: { id: bonusId },
    data
  })
}

// Bonus raporu getir
export async function getBonusReport(
  tenantId: string,
  options: {
    staffId?: string
    period?: BonusPeriod
    year?: number
    month?: number
    week?: number
    quarter?: number
    status?: BonusStatus
  } = {}
) {
  const where: any = { tenantId }

  if (options.staffId) where.staffId = options.staffId
  if (options.period) where.period = options.period
  if (options.year) where.year = options.year
  if (options.month) where.month = options.month
  if (options.week) where.week = options.week
  if (options.quarter) where.quarter = options.quarter
  if (options.status) where.status = options.status

  return db.staffBonus.findMany({
    where,
    include: {
      staff: {
        select: {
          id: true,
          fullName: true,
          avatarUrl: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })
}

// Tüm personel için bonus hesapla (batch)
export async function calculateAllStaffBonuses(
  tenantId: string,
  period: BonusPeriod,
  referenceDate: Date = new Date()
) {
  const staff = await db.staff.findMany({
    where: { tenantId, isActive: true }
  })

  const results = []
  for (const member of staff) {
    try {
      const result = await calculateBonus(member.id, tenantId, period, referenceDate)
      results.push({ staffId: member.id, success: true, data: result })
    } catch (error) {
      results.push({
        staffId: member.id,
        success: false,
        error: error instanceof Error ? error.message : 'Hata oluştu'
      })
    }
  }

  return results
}

// Personel performans özeti
export async function getStaffPerformanceSummary(
  staffId: string,
  tenantId: string,
  days = 30
) {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(endDate.getDate() - days)

  const startStr = startDate.toISOString().split('T')[0]
  const endStr = endDate.toISOString().split('T')[0]

  const [metrics, bonuses, targets] = await Promise.all([
    calculateStaffMetrics(staffId, tenantId, startStr, endStr),
    db.staffBonus.findMany({
      where: { staffId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 6
    }),
    getStaffBonusTargets(staffId)
  ])

  return {
    currentMetrics: metrics,
    recentBonuses: bonuses,
    targets
  }
}
