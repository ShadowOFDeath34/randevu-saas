/**
 * Notification Cost Tracking Service
 * SMS ve Email gönderimlerinin maliyet takibi ve limit kontrolü
 */

import { db } from '@/lib/db'
import { NotificationChannel } from '@prisma/client'
import { logStructured } from './index'

// SMS fiyatları (NetGSM) - TL
const SMS_PRICES = {
  domestic: 0.089, // Yurtiçi SMS
  international: 0.25, // Yurtdışı SMS
}

// Email fiyatları (Resend) - USD
const EMAIL_PRICE = 0.0009 // $0.0009 per email

interface CostTrackingData {
  tenantId: string
  channel: NotificationChannel
  messageLength?: number
  isInternational?: boolean
  recipientCount?: number
}

interface DailyUsage {
  smsCount: number
  emailCount: number
  whatsappCount: number
  estimatedCost: number // TL cinsinden
}

/**
 * SMS segment sayısını hesapla
 * Türkçe SMS: 1 segment = 70 karakter
 * ASCII SMS: 1 segment = 160 karakter
 */
export function calculateSMSSegments(message: string): number {
  const hasUnicode = /[^\u0000-\u007F]/.test(message)
  const maxChars = hasUnicode ? 70 : 160
  const maxCharsConcat = hasUnicode ? 67 : 153

  if (message.length <= maxChars) return 1
  return Math.ceil(message.length / maxCharsConcat)
}

/**
 * SMS maliyetini hesapla
 */
export function calculateSMSCost(
  segments: number,
  isInternational: boolean = false
): number {
  const pricePerSMS = isInternational ? SMS_PRICES.international : SMS_PRICES.domestic
  return segments * pricePerSMS
}

/**
 * Email maliyetini hesapla
 * 1 email = $0.0009 (Resend fiyatı)
 * USD/TL kuru varsayılan 35 TL
 */
export function calculateEmailCost(count: number = 1): number {
  const exchangeRate = 35 // USD to TL
  return count * EMAIL_PRICE * exchangeRate
}

/**
 * Günlük kullanım istatistiklerini getir
 */
export async function getDailyUsage(tenantId: string): Promise<DailyUsage> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Günlük notification logları
  const logs = await db.notificationLog.findMany({
    where: {
      tenantId,
      sentAt: {
        gte: today,
        lt: tomorrow,
      },
    },
    select: {
      channel: true,
      payload: true,
    },
  })

  let smsCount = 0
  let emailCount = 0
  let whatsappCount = 0
  let estimatedCost = 0

  for (const log of logs) {
    switch (log.channel) {
      case NotificationChannel.sms:
        smsCount++
        // Payload'dan segment bilgisi al
        try {
          const payload = JSON.parse(log.payload || '{}')
          const segments = payload.segments || 1
          estimatedCost += calculateSMSCost(segments)
        } catch {
          estimatedCost += calculateSMSCost(1)
        }
        break
      case NotificationChannel.email:
        emailCount++
        estimatedCost += calculateEmailCost(1)
        break
      case NotificationChannel.whatsapp:
        whatsappCount++
        break
    }
  }

  return {
    smsCount,
    emailCount,
    whatsappCount,
    estimatedCost,
  }
}

/**
 * Notification limit kontrolü
 * Limit aşımı varsa false döner
 */
export async function checkNotificationLimits(
  tenantId: string,
  channel: NotificationChannel
): Promise<{ allowed: boolean; reason?: string }> {
  // Tenant notification settings
  const settings = await db.notificationSettings.findUnique({
    where: { tenantId },
  })

  if (!settings) {
    // Varsayılan limitler
    return { allowed: true }
  }

  const usage = await getDailyUsage(tenantId)

  switch (channel) {
    case NotificationChannel.sms:
      if (usage.smsCount >= settings.dailySMSLimit) {
        return {
          allowed: false,
          reason: `Günlük SMS limiti aşıldı (${settings.dailySMSLimit} SMS/gün)`,
        }
      }
      break
    case NotificationChannel.email:
      if (usage.emailCount >= settings.dailyEmailLimit) {
        return {
          allowed: false,
          reason: `Günlük email limiti aşıldı (${settings.dailyEmailLimit} email/gün)`,
        }
      }
      break
  }

  return { allowed: true }
}

/**
 * Notification gönderimini kaydet ve maliyeti hesapla
 */
export async function trackNotificationSent(
  data: CostTrackingData
): Promise<void> {
  try {
    let cost = 0
    let segments = 1

    if (data.channel === NotificationChannel.sms) {
      segments = data.messageLength ? calculateSMSSegments('x'.repeat(data.messageLength)) : 1
      cost = calculateSMSCost(segments, data.isInternational)
    } else if (data.channel === NotificationChannel.email) {
      cost = calculateEmailCost(data.recipientCount || 1)
    }

    // Maliyet logu oluştur
    await db.notificationCostLog.create({
      data: {
        tenantId: data.tenantId,
        channel: data.channel,
        segments,
        cost,
        sentAt: new Date(),
      },
    })

    // Uyarı: Günlük limitin %80'ine ulaşıldı mı?
    const usage = await getDailyUsage(data.tenantId)
    const settings = await db.notificationSettings.findUnique({
      where: { tenantId: data.tenantId },
    })

    if (settings) {
      const smsThreshold = settings.dailySMSLimit * 0.8
      const emailThreshold = settings.dailyEmailLimit * 0.8

      if (usage.smsCount >= smsThreshold) {
        logStructured('warn', 'SMS limit uyarısı', {
          tenantId: data.tenantId,
          usage: usage.smsCount,
          limit: settings.dailySMSLimit,
          percentage: Math.round((usage.smsCount / settings.dailySMSLimit) * 100),
        })
      }

      if (usage.emailCount >= emailThreshold) {
        logStructured('warn', 'Email limit uyarısı', {
          tenantId: data.tenantId,
          usage: usage.emailCount,
          limit: settings.dailyEmailLimit,
          percentage: Math.round((usage.emailCount / settings.dailyEmailLimit) * 100),
        })
      }
    }
  } catch (error) {
    logStructured('error', 'Notification tracking error', {
      error: (error as Error).message,
      tenantId: data.tenantId,
    })
  }
}

/**
 * Aylık notification raporu
 */
export async function getMonthlyReport(
  tenantId: string,
  year: number,
  month: number
): Promise<{
  totalSMS: number
  totalEmail: number
  totalCost: number
  dailyBreakdown: Record<string, { sms: number; email: number; cost: number }>
}> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0)

  const logs = await db.notificationLog.findMany({
    where: {
      tenantId,
      sentAt: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      channel: true,
      sentAt: true,
    },
  })

  const dailyBreakdown: Record<string, { sms: number; email: number; cost: number }> = {}
  let totalSMS = 0
  let totalEmail = 0
  let totalCost = 0

  for (const log of logs) {
    const dateKey = log.sentAt.toISOString().split('T')[0]

    if (!dailyBreakdown[dateKey]) {
      dailyBreakdown[dateKey] = { sms: 0, email: 0, cost: 0 }
    }

    if (log.channel === NotificationChannel.sms) {
      dailyBreakdown[dateKey].sms++
      dailyBreakdown[dateKey].cost += calculateSMSCost(1)
      totalSMS++
      totalCost += calculateSMSCost(1)
    } else if (log.channel === NotificationChannel.email) {
      dailyBreakdown[dateKey].email++
      dailyBreakdown[dateKey].cost += calculateEmailCost(1)
      totalEmail++
      totalCost += calculateEmailCost(1)
    }
  }

  return {
    totalSMS,
    totalEmail,
    totalCost,
    dailyBreakdown,
  }
}
