import { db } from '@/lib/db'
import { BranchType, BranchStatus } from '@prisma/client'

// Şube oluşturma
export async function createBranch(data: {
  tenantId: string
  name: string
  type?: BranchType
  code?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  district?: string
}) {
  const { tenantId, name, type = 'satellite', code, phone, email, address, city, district } = data

  // Benzersiz bookingSlug oluştur
  const slugBase = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const bookingSlug = `${slugBase}-${Date.now().toString(36).slice(-4)}`

  const branch = await db.branch.create({
    data: {
      tenantId,
      name,
      type,
      code,
      phone,
      email,
      address,
      city,
      district,
      bookingSlug,
      bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.randevuai.com'}/b/${bookingSlug}`
    }
  })

  // Varsayılan çalışma saatlerini oluştur (tenant'ın saatlerini kopyala)
  const tenantHours = await db.businessHour.findMany({
    where: { tenantId }
  })

  for (const hour of tenantHours) {
    await db.branchBusinessHour.create({
      data: {
        branchId: branch.id,
        tenantId,
        dayOfWeek: hour.dayOfWeek,
        openTime: hour.openTime,
        closeTime: hour.closeTime,
        isClosed: hour.isClosed
      }
    })
  }

  return branch
}

// Tüm şubeleri getir
export async function getBranches(tenantId: string, includeInactive = false) {
  return db.branch.findMany({
    where: {
      tenantId,
      status: includeInactive ? undefined : 'active'
    },
    orderBy: [
      { type: 'asc' }, // Ana şube önce
      { name: 'asc' }
    ],
    include: {
      _count: {
        select: {
          staff: true,
          bookings: { where: { status: { notIn: ['cancelled', 'no_show'] } } }
        }
      }
    }
  })
}

// Tek şube getir
export async function getBranchById(branchId: string, tenantId: string) {
  return db.branch.findFirst({
    where: { id: branchId, tenantId },
    include: {
      businessHours: true,
      services: {
        include: {
          service: true
        }
      },
      staff: {
        where: { isActive: true },
        select: {
          id: true,
          fullName: true,
          title: true,
          avatarUrl: true
        }
      },
      _count: {
        select: {
          bookings: { where: { status: { notIn: ['cancelled', 'no_show'] } } },
          staff: true
        }
      }
    }
  })
}

// Şube güncelle
export async function updateBranch(
  branchId: string,
  tenantId: string,
  data: Partial<{
    name: string
    type: BranchType
    status: BranchStatus
    code: string
    phone: string
    email: string
    address: string
    city: string
    district: string
    latitude: number
    longitude: number
    customHours: boolean
    maxConcurrentBookings: number
    maxStaffCount: number
    hasParking: boolean
    isAccessible: boolean
    hasWaitingArea: boolean
    hasOnlineBooking: boolean
  }>
) {
  const branch = await db.branch.findFirst({
    where: { id: branchId, tenantId }
  })

  if (!branch) {
    throw new Error('Branch not found')
  }

  return db.branch.update({
    where: { id: branchId },
    data: {
      ...data,
      updatedAt: new Date()
    }
  })
}

// Şube sil (soft delete yerine status inactive yap)
export async function deactivateBranch(branchId: string, tenantId: string) {
  const branch = await db.branch.findFirst({
    where: { id: branchId, tenantId }
  })

  if (!branch) {
    throw new Error('Branch not found')
  }

  // Ana şube silinemez
  if (branch.type === 'main') {
    throw new Error('Ana şube silinemez')
  }

  return db.branch.update({
    where: { id: branchId },
    data: { status: 'inactive', updatedAt: new Date() }
  })
}

// Şube çalışma saatlerini güncelle
export async function updateBranchHours(
  branchId: string,
  tenantId: string,
  hours: Array<{
    dayOfWeek: number
    openTime?: string | null
    closeTime?: string | null
    isClosed?: boolean
    lunchBreakStart?: string | null
    lunchBreakEnd?: string | null
  }>
) {
  const branch = await db.branch.findFirst({
    where: { id: branchId, tenantId }
  })

  if (!branch) {
    throw new Error('Branch not found')
  }

  // Transaction ile tüm saatleri güncelle
  await db.$transaction(async (tx) => {
    for (const hour of hours) {
      await tx.branchBusinessHour.upsert({
        where: {
          branchId_dayOfWeek: {
            branchId,
            dayOfWeek: hour.dayOfWeek
          }
        },
        update: {
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed ?? false,
          lunchBreakStart: hour.lunchBreakStart,
          lunchBreakEnd: hour.lunchBreakEnd
        },
        create: {
          branchId,
          tenantId,
          dayOfWeek: hour.dayOfWeek,
          openTime: hour.openTime,
          closeTime: hour.closeTime,
          isClosed: hour.isClosed ?? false,
          lunchBreakStart: hour.lunchBreakStart,
          lunchBreakEnd: hour.lunchBreakEnd
        }
      })
    }
  })

  // customHours flag'ini güncelle
  await db.branch.update({
    where: { id: branchId },
    data: { customHours: true }
  })

  return true
}

// Şube hizmetlerini yönet
export async function manageBranchServices(
  branchId: string,
  tenantId: string,
  services: Array<{
    serviceId: string
    isAvailable: boolean
    customPrice?: number
    customDurationMinutes?: number
  }>
) {
  const branch = await db.branch.findFirst({
    where: { id: branchId, tenantId }
  })

  if (!branch) {
    throw new Error('Branch not found')
  }

  await db.$transaction(async (tx) => {
    for (const svc of services) {
      await tx.branchService.upsert({
        where: {
          branchId_serviceId: {
            branchId,
            serviceId: svc.serviceId
          }
        },
        update: {
          isAvailable: svc.isAvailable,
          customPrice: svc.customPrice,
          customDurationMinutes: svc.customDurationMinutes
        },
        create: {
          branchId,
          tenantId,
          serviceId: svc.serviceId,
          isAvailable: svc.isAvailable,
          customPrice: svc.customPrice,
          customDurationMinutes: svc.customDurationMinutes
        }
      })
    }
  })

  return true
}

// Personel-şube ataması
export async function assignStaffToBranch(
  staffId: string,
  branchId: string,
  tenantId: string,
  data: {
    isPrimary?: boolean
    workingDays?: number[]
    startTime?: string
    endTime?: string
  }
) {
  const [staff, branch] = await Promise.all([
    db.staff.findFirst({ where: { id: staffId, tenantId } }),
    db.branch.findFirst({ where: { id: branchId, tenantId } })
  ])

  if (!staff || !branch) {
    throw new Error('Staff or branch not found')
  }

  // Eğer bu primary atama ise, diğer primary'leri kaldır
  if (data.isPrimary) {
    await db.staffBranchAssignment.updateMany({
      where: { staffId, isPrimary: true },
      data: { isPrimary: false }
    })
  }

  return db.staffBranchAssignment.upsert({
    where: {
      staffId_branchId: {
        staffId,
        branchId
      }
    },
    update: {
      isPrimary: data.isPrimary,
      workingDays: data.workingDays,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: true
    },
    create: {
      staffId,
      branchId,
      tenantId,
      isPrimary: data.isPrimary ?? true,
      workingDays: data.workingDays || [],
      startTime: data.startTime,
      endTime: data.endTime
    }
  })
}

// Şube istatistikleri
export async function getBranchStats(branchId: string, tenantId: string, days = 30) {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const [bookings, staffCount] = await Promise.all([
    db.booking.count({
      where: {
        branchId,
        tenantId,
        status: { notIn: ['cancelled', 'no_show'] },
        createdAt: { gte: startDate }
      }
    }),
    db.staff.count({
      where: {
        branchId,
        tenantId,
        isActive: true
      }
    })
  ])

  // Revenue hesapla - booking'lerin service fiyatlarını topla
  const bookingsWithService = await db.booking.findMany({
    where: {
      branchId,
      tenantId,
      status: { notIn: ['cancelled', 'no_show'] },
      createdAt: { gte: startDate }
    },
    include: {
      service: {
        select: { price: true }
      }
    }
  })

  const revenue = bookingsWithService.reduce((acc, b) => acc + (b.service?.price || 0), 0)

  return {
    bookings,
    revenue,
    staffCount,
    avgBookingsPerDay: Math.round(bookings / days * 10) / 10
  }
}

// Kullanıcının erişebildiği şubeleri getir
export async function getUserAccessibleBranches(userId: string, tenantId: string) {
  const user = await db.user.findFirst({
    where: { id: userId, tenantId },
    include: {
      branchPermissions: {
        include: { branch: true }
      }
    }
  })

  if (!user) {
    return []
  }

  // Owner veya admin tüm şubelere erişebilir
  if (user.role === 'owner' || user.role === 'admin') {
    return getBranches(tenantId)
  }

  // Diğer kullanıcılar sadece yetkilendirildikleri şubelere erişebilir
  return user.branchPermissions
    .filter(bp => bp.branch.status === 'active')
    .map(bp => bp.branch)
}

// Şube karşılaştırma raporu
export async function getBranchComparisonReport(tenantId: string, days = 30) {
  const branches = await getBranches(tenantId)
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const report = await Promise.all(
    branches.map(async (branch) => {
      const stats = await getBranchStats(branch.id, tenantId, days)
      return {
        branchId: branch.id,
        branchName: branch.name,
        branchType: branch.type,
        city: branch.city,
        ...stats
      }
    })
  )

  return report.sort((a, b) => b.revenue - a.revenue)
}
