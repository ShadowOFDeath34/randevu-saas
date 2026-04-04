import { db } from '@/lib/db'

// Randevu yönlendirme kriterleri
export interface RoutingCriteria {
  serviceId: string
  branchId?: string
  date: string
  startTime: string
  endTime: string
  customerId?: string
  preferredStaffId?: string
  requireSpecificGender?: boolean
}

// Personel uygunluk skoru
export interface StaffScore {
  staffId: string
  fullName: string
  avatarUrl?: string
  title?: string
  score: number
  factors: {
    skillMatch: number // 0-100
    availability: number // 0-100
    workload: number // 0-100 (düşük workload = yüksek skor)
    customerPreference: number // 0-100
    proximity: number // 0-100
  }
  currentLoad: number // Günlük randevu sayısı
  canServe: boolean // Bu hizmeti verebilir mi
}

// En uygun personeli bul
export async function findBestStaff(
  tenantId: string,
  criteria: RoutingCriteria
): Promise<StaffScore[]> {
  // 1. Bu hizmeti verebilen personelleri bul
  const eligibleStaff = await db.staff.findMany({
    where: {
      tenantId,
      isActive: true,
      ...(criteria.branchId ? { branchId: criteria.branchId } : {}),
      services: {
        some: {
          serviceId: criteria.serviceId
        }
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

  // 2. Her personel için skor hesapla
  const scoredStaff = await Promise.all(
    eligibleStaff.map(async (staff) => {
      const scores: StaffScore = {
        staffId: staff.id,
        fullName: staff.fullName,
        avatarUrl: staff.avatarUrl || undefined,
        title: staff.title || undefined,
        score: 0,
        factors: {
          skillMatch: 100, // Hizmet bağlantısı varsa %100
          availability: 0,
          workload: 0,
          customerPreference: 0,
          proximity: 100 // Branch zaten filtrelendi
        },
        currentLoad: 0,
        canServe: true
      }

      // 2.1 Müsaitlik kontrolü
      const availability = await checkStaffAvailability(
        staff.id,
        criteria.date,
        criteria.startTime,
        criteria.endTime
      )
      scores.factors.availability = availability.available ? 100 : 0
      scores.canServe = availability.available

      // 2.2 İş yükü kontrolü
      const dailyLoad = await getStaffDailyLoad(
        staff.id,
        criteria.date
      )
      scores.currentLoad = dailyLoad
      // Düşük workload = yüksek skor (max 10 randevu varsayımı)
      scores.factors.workload = Math.max(0, 100 - (dailyLoad * 10))

      // 2.3 Müşteri tercihi kontrolü
      if (criteria.customerId) {
        const preference = await getCustomerStaffPreference(
          criteria.customerId,
          staff.id
        )
        scores.factors.customerPreference = preference.score
      }

      // 2.4 Cinsiyet tercihi (ileride eklenecek)
      if (criteria.requireSpecificGender) {
        // Müşteri profilinden cinsiyet tercihi kontrolü
        scores.factors.proximity = 100
      }

      // Toplam skor hesapla (ağırlıklı)
      scores.score =
        scores.factors.skillMatch * 0.25 +
        scores.factors.availability * 0.30 +
        scores.factors.workload * 0.20 +
        scores.factors.customerPreference * 0.15 +
        scores.factors.proximity * 0.10

      return scores
    })
  )

  // Sadece müsait olanları döndür, skora göre sırala
  return scoredStaff
    .filter(s => s.canServe)
    .sort((a, b) => b.score - a.score)
}

// Personel müsaitlik kontrolü
async function checkStaffAvailability(
  staffId: string,
  date: string,
  startTime: string,
  endTime: string
): Promise<{ available: boolean; conflicts?: any[] }> {
  // 1. Çalışma saati kontrolü
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

  // 2. Mevcut randevu çakışması kontrolü
  const conflictingBookings = await db.booking.findMany({
    where: {
      staffId,
      bookingDate: date,
      status: { notIn: ['cancelled', 'no_show'] },
      OR: [
        {
          // Yeni randevu başlangıcı mevcut randevu içinde
          startTime: { lte: startTime },
          endTime: { gt: startTime }
        },
        {
          // Yeni randevu bitişi mevcut randevu içinde
          startTime: { lt: endTime },
          endTime: { gte: endTime }
        },
        {
          // Yeni randevu mevcut randevuyu tamamen kapsıyor
          startTime: { gte: startTime },
          endTime: { lte: endTime }
        }
      ]
    }
  })

  if (conflictingBookings.length > 0) {
    return { available: false, conflicts: conflictingBookings }
  }

  return { available: true }
}

// Günlük iş yükü
async function getStaffDailyLoad(staffId: string, date: string): Promise<number> {
  const count = await db.booking.count({
    where: {
      staffId,
      bookingDate: date,
      status: { notIn: ['cancelled', 'no_show'] }
    }
  })
  return count
}

// Müşteri-personel uyumluluğu
async function getCustomerStaffPreference(
  customerId: string,
  staffId: string
): Promise<{ score: number; history: any[] }> {
  // Geçmiş randevuları kontrol et
  const pastBookings = await db.booking.findMany({
    where: {
      customerId,
      staffId,
      status: 'completed'
    },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      reviewRequest: {
        select: { rating: true }
      }
    }
  })

  if (pastBookings.length === 0) {
    return { score: 50, history: [] } // Neutral
  }

  // Değerlendirme puanlarını hesapla
  let totalRating = 0
  let ratingCount = 0

  for (const booking of pastBookings) {
    if (booking.reviewRequest?.rating) {
      totalRating += booking.reviewRequest.rating
      ratingCount++
    }
  }

  const avgRating = ratingCount > 0 ? totalRating / ratingCount : 3
  // 5 üzerinden puanı 100'e çevir
  const score = (avgRating / 5) * 100

  // Randevu sayısı bonusu (sadık müşteri)
  const loyaltyBonus = Math.min(pastBookings.length * 5, 20)

  return {
    score: Math.min(score + loyaltyBonus, 100),
    history: pastBookings
  }
}

// Alternatif zaman slotları öner
export async function suggestAlternativeSlots(
  tenantId: string,
  criteria: RoutingCriteria,
  daysToCheck: number = 7
): Promise<Array<{
  date: string
  startTime: string
  endTime: string
  staffId: string
  staffName: string
  score: number
}>> {
  const suggestions: Array<{
    date: string
    startTime: string
    endTime: string
    staffId: string
    staffName: string
    score: number
  }> = []

  const baseDate = new Date(criteria.date)

  for (let i = 0; i < daysToCheck; i++) {
    const checkDate = new Date(baseDate)
    checkDate.setDate(baseDate.getDate() + i)
    const dateStr = checkDate.toISOString().split('T')[0]

    const bestStaff = await findBestStaff(tenantId, {
      ...criteria,
      date: dateStr
    })

    if (bestStaff.length > 0) {
      const topStaff = bestStaff[0]
      suggestions.push({
        date: dateStr,
        startTime: criteria.startTime,
        endTime: criteria.endTime,
        staffId: topStaff.staffId,
        staffName: topStaff.fullName,
        score: topStaff.score
      })
    }
  }

  return suggestions.sort((a, b) => b.score - a.score).slice(0, 5)
}

// Hizmet süresi hesapla
export async function calculateServiceDuration(
  serviceId: string,
  staffId?: string
): Promise<number> {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true }
  })

  if (!service) return 30 // Default 30 dk

  return service.durationMinutes
}

// Optimum zaman aralığı bul
export async function findOptimalTimeSlots(
  tenantId: string,
  serviceId: string,
  branchId: string,
  date: string,
  preferredStaffId?: string
): Promise<Array<{
  startTime: string
  endTime: string
  staffId: string
  staffName: string
  availability: number
}>> {
  const slots: Array<{
    startTime: string
    endTime: string
    staffId: string
    staffName: string
    availability: number
  }> = []

  const service = await db.service.findUnique({
    where: { id: serviceId },
    select: { durationMinutes: true }
  })

  if (!service) return []

  // Bu hizmeti verebilen personeller
  const staffList = await db.staff.findMany({
    where: {
      tenantId,
      branchId,
      isActive: true,
      services: {
        some: { serviceId }
      }
    }
  })

  // Çalışma saatlerini al
  const dayOfWeek = new Date(date).getDay()
  const workingHours = await db.staffWorkingHour.findMany({
    where: {
      staffId: { in: staffList.map(s => s.id) },
      dayOfWeek: dayOfWeek === 0 ? 7 : dayOfWeek,
      isClosed: false
    }
  })

  for (const staff of staffList) {
    const wh = workingHours.find(w => w.staffId === staff.id)
    if (!wh || !wh.openTime || !wh.closeTime) continue

    // Basitleştirilmiş: 30dk aralıklarla slotlar oluştur
    const duration = service.durationMinutes
    const slots_per_day = Math.floor(
      (parseInt(wh.closeTime.replace(':', '')) - parseInt(wh.openTime.replace(':', ''))) /
      (duration / 60 * 100)
    )

    for (let i = 0; i < slots_per_day; i++) {
      const startHour = parseInt(wh.openTime.split(':')[0])
      const startMin = parseInt(wh.openTime.split(':')[1]) + (i * duration)
      const totalMinutes = startHour * 60 + startMin
      const endTotalMinutes = totalMinutes + duration

      const startTime = `${Math.floor(totalMinutes / 60).toString().padStart(2, '0')}:${(totalMinutes % 60).toString().padStart(2, '0')}`
      const endTime = `${Math.floor(endTotalMinutes / 60).toString().padStart(2, '0')}:${(endTotalMinutes % 60).toString().padStart(2, '0')}`

      const availability = await checkStaffAvailability(
        staff.id,
        date,
        startTime,
        endTime
      )

      if (availability.available) {
        slots.push({
          startTime,
          endTime,
          staffId: staff.id,
          staffName: staff.fullName,
          availability: 100
        })
      }
    }
  }

  return slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
}

// Toplu randevu optimizasyonu
export async function optimizeDailySchedule(
  tenantId: string,
  branchId: string,
  date: string
): Promise<{
  optimized: boolean
  changes: Array<{
    bookingId: string
    oldStaffId: string
    newStaffId: string
    reason: string
  }>
  stats: {
    totalBookings: number
    avgWaitTime: number
    staffUtilization: Record<string, number>
  }
}> {
  const bookings = await db.booking.findMany({
    where: {
      tenantId,
      branchId,
      bookingDate: date,
      status: { notIn: ['cancelled', 'no_show'] }
    },
    include: {
      service: true,
      staff: true
    }
  })

  const changes: Array<{
    bookingId: string
    oldStaffId: string
    newStaffId: string
    reason: string
  }> = []

  const staffUtilization: Record<string, number> = {}

  for (const booking of bookings) {
    if (!staffUtilization[booking.staffId]) {
      staffUtilization[booking.staffId] = 0
    }
    staffUtilization[booking.staffId]++
  }

  return {
    optimized: changes.length > 0,
    changes,
    stats: {
      totalBookings: bookings.length,
      avgWaitTime: 0,
      staffUtilization
    }
  }
}
