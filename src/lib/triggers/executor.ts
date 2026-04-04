import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import { sendEmail } from '@/lib/email'

interface TriggerContext {
  manual?: boolean
  bookingId?: string
  customerId?: string
  [key: string]: unknown
}

const TEMPLATE_MESSAGES: Record<string, string> = {
  booking_confirmed: 'Randevunuz onaylandı. Tarih: {date}, Saat: {time}. İşlem: {service}. Bizi tercih ettiğiniz için teşekkürler!',
  booking_cancelled: 'Randevunuz iptal edildi. Yeni bir randevu almak için bizimle iletişime geçebilirsiniz.',
  booking_no_show: 'Randevunuza gelmediğinizi fark ettik. Bir sonraki sefer için hatırlatma almak ister misiniz?',
  booking_completed: 'Hizmetimizi denediğiniz için teşekkürler! Değerlendirmenizi bekliyoruz.',
  appointment_reminder_24h: 'Yarın saat {time} randevunuz var. Hatırlatmak isterdik.',
  appointment_reminder_2h: 'Randevunuz başlamak üzere! 2 saat içinde saat {time} bekliyoruz.',
  customer_birthday: 'Doğum gününüz kutlu olsun! Size özel %{discount} indirim kodunuz: {code}',
  customer_at_risk: 'Sizi özledik! Bizi tekrar tercih ederseniz %{discount} indirim sunuyoruz.',
  customer_inactive_30d: '30 gündür görüşmedik. Yeni hizmetlerimizi keşfetmek ister misiniz?',
  customer_inactive_60d: '60 gündür uğramadınız. Size özel bir teklifimiz var - %{discount} indirim!'
}

export async function executeTrigger(
  trigger: {
    id: string
    tenantId: string
    name: string
    triggerType: string
    action: string
    conditions: string | null
    delayMinutes: number
  },
  context: TriggerContext = {}
) {
  const startTime = Date.now()

  try {
    // Get conditions
    const conditions = trigger.conditions ? JSON.parse(trigger.conditions) : {}

    // Find target customers based on trigger type and conditions
    const targetCustomers = await findTargetCustomers(trigger.tenantId, trigger.triggerType, conditions, context)

    if (targetCustomers.length === 0) {
      return {
        success: true,
        message: 'No target customers found',
        executed: 0
      }
    }

    // Execute action for each customer
    const results: unknown[] = []
    for (const customer of targetCustomers) {
      const result = await executeAction(trigger, customer, context)
      results.push(result)

      // Log execution
      await db.triggerExecutionLog.create({
        data: {
          triggerId: trigger.id,
          tenantId: trigger.tenantId,
          customerId: customer.id,
          bookingId: context.bookingId,
          status: result.success ? 'success' : 'failed',
          payload: result.payload,
          errorMessage: result.error
        }
      })
    }

    // Update trigger stats
    await db.campaignTrigger.update({
      where: { id: trigger.id },
      data: {
        lastTriggeredAt: new Date(),
        triggerCount: { increment: targetCustomers.length }
      }
    })

    return {
      success: true,
      executed: targetCustomers.length,
      duration: Date.now() - startTime,
      results
    }
  } catch (error) {
    console.error('Trigger execution error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      executed: 0
    }
  }
}

async function findTargetCustomers(
  tenantId: string,
  triggerType: string,
  conditions: Record<string, unknown>,
  context: TriggerContext
) {
  // If manual execution with specific customer/booking, use that
  if (context.customerId) {
    const customer = await db.customer.findFirst({
      where: { id: context.customerId, tenantId }
    })
    return customer ? [customer] : []
  }

  // Otherwise find based on trigger type
  switch (triggerType) {
    case 'booking_confirmed':
    case 'booking_cancelled':
    case 'booking_no_show':
    case 'booking_completed':
      // These are event-based, customer info comes from the event
      if (context.bookingId) {
        const booking = await db.booking.findFirst({
          where: { id: context.bookingId, tenantId },
          include: { customer: true }
        })
        return booking?.customer ? [booking.customer] : []
      }
      return []

    case 'appointment_reminder_24h':
      // Find bookings 24 hours from now
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowStr = tomorrow.toISOString().split('T')[0]

      const bookings24h = await db.booking.findMany({
        where: {
          tenantId,
          bookingDate: tomorrowStr,
          status: { in: ['confirmed', 'pending'] }
        },
        include: { customer: true }
      })
      return bookings24h.map(b => b.customer).filter(Boolean)

    case 'appointment_reminder_2h':
      // Find bookings in next 2 hours
      const now = new Date()
      const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000)
      const currentHour = now.getHours()
      const targetHour = in2Hours.getHours()

      const bookings2h = await db.booking.findMany({
        where: {
          tenantId,
          bookingDate: now.toISOString().split('T')[0],
          startTime: {
            gte: `${currentHour}:00`,
            lte: `${targetHour}:59`
          },
          status: { in: ['confirmed', 'pending'] }
        },
        include: { customer: true }
      })
      return bookings2h.map(b => b.customer).filter(Boolean)

    case 'customer_birthday':
      // Find customers with birthday today
      const today = new Date()
      const month = today.getMonth() + 1
      const day = today.getDate()

      // Note: This requires storing birthdate in Customer model
      // For now, return empty or query differently
      return []

    case 'customer_at_risk':
      // Find at-risk customers (no booking in 60 days)
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      const atRiskCustomers = await db.customer.findMany({
        where: {
          tenantId,
          customerSegment: 'at_risk',
          lastVisitDate: { lt: sixtyDaysAgo }
        }
      })
      return atRiskCustomers

    case 'customer_inactive_30d':
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const inactive30d = await db.customer.findMany({
        where: {
          tenantId,
          lastVisitDate: { lt: thirtyDaysAgo }
        }
      })
      return inactive30d

    case 'customer_inactive_60d':
      const inactive60dAgo = new Date()
      inactive60dAgo.setDate(inactive60dAgo.getDate() - 60)

      const inactive60d = await db.customer.findMany({
        where: {
          tenantId,
          lastVisitDate: { lt: inactive60dAgo }
        }
      })
      return inactive60d

    default:
      return []
  }
}

async function executeAction(
  trigger: {
    id: string
    tenantId: string
    action: string
    triggerType: string
  },
  customer: { id: string; fullName: string; phone: string; email: string | null },
  context: TriggerContext
) {
  const message = TEMPLATE_MESSAGES[trigger.triggerType] || 'Merhaba {name}, size özel bir mesajımız var.'

  // Personalize message
  const personalizedMessage = message
    .replace('{name}', customer.fullName)
    .replace('{discount}', '20')
    .replace('{code}', `WELCOME${Math.floor(Math.random() * 10000)}`)

  try {
    switch (trigger.action) {
      case 'send_sms':
        if (!customer.phone) {
          return { success: false, error: 'Customer has no phone number', payload: null }
        }
        await sendSMS({
          to: customer.phone,
          message: personalizedMessage
        })
        return { success: true, payload: { channel: 'sms', message: personalizedMessage } }

      case 'send_email':
        if (!customer.email) {
          return { success: false, error: 'Customer has no email', payload: null }
        }
        await sendEmail({
          to: customer.email,
          subject: 'Size özel bir mesajımız var',
          html: `<p>${personalizedMessage}</p>`
        })
        return { success: true, payload: { channel: 'email', message: personalizedMessage } }

      case 'send_notification':
        // In-app notification
        return { success: true, payload: { channel: 'notification', message: personalizedMessage } }

      default:
        return { success: false, error: 'Unknown action type', payload: null }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Action execution failed',
      payload: null
    }
  }
}
