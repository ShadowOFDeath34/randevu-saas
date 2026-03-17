import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { minutesToTime, timeToMinutes } from '@/lib/utils'
import { checkIPRateLimit, defaultConfigs, createRateLimitResponse } from '@/lib/rate-limit'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  // Rate limiting: 10 requests per minute per IP
  const rateLimit = await checkIPRateLimit(req, defaultConfigs.public)
  if (!rateLimit.success) {
    return createRateLimitResponse(rateLimit)
  }
  try {
    const { slug } = await params
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date')
    const serviceId = searchParams.get('serviceId')
    const staffId = searchParams.get('staffId')

    if (!date) {
      return NextResponse.json({ error: 'Tarih gereklidir' }, { status: 400 })
    }

    const tenant = await db.tenant.findUnique({
      where: { slug },
      include: {
        businessProfile: true,
        businessHours: true,
        staff: {
          where: { isActive: true },
          include: {
            workingHours: true,
            services: true
          }
        },
        services: {
          where: { isActive: true }
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'İşletme bulunamadı' }, { status: 404 })
    }

    const selectedDate = new Date(date)
    const dayOfWeek = selectedDate.getDay()

    const businessHour = tenant.businessHours.find(h => h.dayOfWeek === dayOfWeek)

    if (!businessHour || businessHour.isClosed) {
      return NextResponse.json({ slots: [], message: 'İşletme bugün kapalı' })
    }

    let availableStaff = tenant.staff

    if (staffId) {
      availableStaff = availableStaff.filter(s => s.id === staffId)
    }

    if (serviceId) {
      availableStaff = availableStaff.filter(s => 
        s.services.some(ss => ss.serviceId === serviceId)
      )
    }

    const bookings = await db.booking.findMany({
      where: {
        tenantId: tenant.id,
        bookingDate: date,
        status: { notIn: ['cancelled'] }
      }
    })

    const service = serviceId 
      ? tenant.services.find(s => s.id === serviceId) 
      : null

    const slotInterval = 15
    const slots: { time: string; staff: { id: string; name: string }[] }[] = []

    const businessOpen = timeToMinutes(businessHour.openTime || '09:00')
    const businessClose = timeToMinutes(businessHour.closeTime || '18:00')
    const serviceDuration = service ? service.durationMinutes : 30

    // Bug tespiti: Kullanıcı bugünü seçtiyse, geçmiş saatler listelenmemeli (Örn: saat 15:00 ise 09:00 boş görünmemeli)
    const now = new Date()
    const isToday = selectedDate.toISOString().split('T')[0] === now.toISOString().split('T')[0]
    const currentMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : 0
    // Randevu almak için en az belli bir buffer eklenebilir (opsiyonel, şu anki saatten sonrasına izin veriyoruz)

    for (let minutes = businessOpen; minutes + serviceDuration <= businessClose; minutes += slotInterval) {
      // Geçmiş saatleri direk atla
      if (minutes <= currentMinutes) continue

      const time = minutesToTime(minutes)
      
      const availableStaffForSlot = availableStaff.filter(staffMember => {
        const staffHour = staffMember.workingHours.find(wh => wh.dayOfWeek === dayOfWeek)
        
        if (!staffHour || staffHour.isClosed) return false
        
        const staffOpen = timeToMinutes(staffHour.openTime || '09:00')
        const staffClose = timeToMinutes(staffHour.closeTime || '18:00')
        
        if (minutes < staffOpen || minutes + serviceDuration > staffClose) return false

        const hasConflict = bookings.some(booking => {
          if (booking.staffId !== staffMember.id) return false
          
          const bookingStart = timeToMinutes(booking.startTime)
          const bookingEnd = timeToMinutes(booking.endTime)
          
          return (minutes < bookingEnd && minutes + serviceDuration > bookingStart)
        })

        return !hasConflict
      })

      if (availableStaffForSlot.length > 0) {
        slots.push({
          time,
          staff: availableStaffForSlot.map(s => ({ id: s.id, name: s.fullName }))
        })
      }
    }

    return NextResponse.json({ slots, businessHours: businessHour })
  } catch (error) {
    console.error('Error calculating slots:', error)
    return NextResponse.json({ error: 'Slot hesaplama hatası' }, { status: 500 })
  }
}
