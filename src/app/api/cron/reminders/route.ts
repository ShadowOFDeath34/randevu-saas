import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import { sendBookingReminderEmail } from '@/lib/email'
import { smsTemplateService } from '@/lib/sms/template-service'

/**
 * GET /api/cron/reminders
 * Otomatik hatırlatma gönderimi için cron job endpoint'i
 * SMS Template sistemini kullanır
 */

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const results = { reminders24h: { sent: 0, failed: 0 }, reminders1h: { sent: 0, failed: 0 } }

    // 24 saat sonraki rezervasyonlar
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const tomorrowStr = tomorrow.toISOString().split('T')[0]

    const bookings24h = await db.booking.findMany({
      where: {
        bookingDate: tomorrowStr,
        status: 'confirmed',
        deletedAt: null,
      },
      include: { customer: true, service: true, tenant: true },
    })

    // 24 saat hatırlatmaları
    for (const booking of bookings24h) {
      try {
        // SMS Template sisteminden özelleştirilmiş mesaj al
        const message = await smsTemplateService.formatBookingReminder24h(
          booking.tenantId,
          {
            customerName: booking.customer.fullName,
            serviceName: booking.service.name,
            date: booking.bookingDate,
            time: booking.startTime,
            businessName: booking.tenant.name,
          }
        ) || `Merhaba ${booking.customer.fullName}, yarın ${booking.startTime}'de ${booking.service.name} randevunuz var.`

        if (booking.customer.phone) {
          await sendSMS({
            phone: booking.customer.phone,
            message,
            tenantId: booking.tenantId,
            bookingId: booking.id,
          })
        }

        if (booking.customer.email) {
          await sendBookingReminderEmail(booking.customer.email, {
            customerName: booking.customer.fullName,
            serviceName: booking.service.name,
            date: booking.bookingDate,
            time: booking.startTime,
            hoursBefore: 24,
            businessName: booking.tenant.name,
          })
        }

        results.reminders24h.sent++
      } catch (_err) {
        console.error('24h reminder failed:', _err)
        results.reminders24h.failed++
      }
    }

    // 1 saat sonraki rezervasyonlar (bugün, bir saat sonra başlayacaklar)
    const oneHourLater = new Date()
    oneHourLater.setHours(oneHourLater.getHours() + 1)
    const targetTime = oneHourLater.toTimeString().slice(0, 5) // HH:MM format

    const bookings1h = await db.booking.findMany({
      where: {
        bookingDate: new Date().toISOString().split('T')[0],
        startTime: { startsWith: targetTime.slice(0, 4) }, // Yaklaşık eşleşme
        status: 'confirmed',
        deletedAt: null,
      },
      include: { customer: true, service: true, tenant: true },
    })

    // 1 saat hatırlatmaları
    for (const booking of bookings1h) {
      try {
        // SMS Template sisteminden özelleştirilmiş mesaj al
        const message = await smsTemplateService.formatBookingReminder1h(
          booking.tenantId,
          {
            customerName: booking.customer.fullName,
            serviceName: booking.service.name,
            time: booking.startTime,
            businessName: booking.tenant.name,
          }
        ) || `Merhaba ${booking.customer.fullName}, bir saat sonra ${booking.startTime}'de ${booking.service.name} randevunuz var.`

        if (booking.customer.phone) {
          await sendSMS({
            phone: booking.customer.phone,
            message,
            tenantId: booking.tenantId,
            bookingId: booking.id,
          })
        }

        if (booking.customer.email) {
          await sendBookingReminderEmail(booking.customer.email, {
            customerName: booking.customer.fullName,
            serviceName: booking.service.name,
            date: booking.bookingDate,
            time: booking.startTime,
            hoursBefore: 1,
            businessName: booking.tenant.name,
          })
        }

        results.reminders1h.sent++
      } catch (_err) {
        console.error('1h reminder failed:', _err)
        results.reminders1h.failed++
      }
    }

    return NextResponse.json({
      success: true,
      results,
      summary: { totalSent: results.reminders24h.sent + results.reminders1h.sent },
    })
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}
