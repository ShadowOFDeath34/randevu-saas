/**
 * SMS Service - Ana modül
 * NetGSM entegrasyonu ve yardımcı fonksiyonlar
 */

import { sendNetGSMSMS, sendBulkSMS, SMSResult } from './netgsm'
import { db } from '@/lib/db'

export { sendBulkSMS }

export interface SendSMSParams {
  phone: string
  message: string
  tenantId?: string
  bookingId?: string
  customerId?: string
}

/**
 * Tekil SMS gönder ve logla
 */
export async function sendSMS(params: SendSMSParams): Promise<SMSResult> {
  const { phone, message, tenantId, bookingId, customerId } = params

  try {
    // NetGSM'e gönder
    const result = await sendNetGSMSMS(phone, message)

    // Log kaydı (eğer tenantId varsa)
    if (tenantId) {
      await db.notificationLog.create({
        data: {
          tenantId,
          bookingId,
          customerId,
          channel: 'sms',
          status: result.success ? 'sent' : 'failed',
          payload: JSON.stringify({
            phone,
            message: message.substring(0, 100) + '...',
            messageId: result.messageId,
            error: result.error
          }),
          sentAt: new Date()
        }
      })
    }

    return result
  } catch (error) {
    console.error('SMS service hatası:', error)

    // Hata durumunda da log kaydet
    if (tenantId) {
      await db.notificationLog.create({
        data: {
          tenantId,
          bookingId,
          customerId,
          channel: 'sms',
          status: 'failed',
          payload: JSON.stringify({
            phone,
            error: (error as Error).message
          }),
          sentAt: new Date()
        }
      })
    }

    return { success: false, error: (error as Error).message }
  }
}

/**
 * OTP kodu gönder
 */
export async function sendOTP(phone: string, code: string, tenantId?: string): Promise<SMSResult> {
  const { smsTemplateService } = await import('./template-service')
  
  let message: string
  
  if (tenantId) {
    // Try to use custom template
    const formatted = await smsTemplateService.formatVerificationCode(tenantId, { 
      code, 
      businessName: '' // Will be filled from business profile if needed
    })
    message = formatted || `RandevuAI doğrulama kodunuz: ${code}. Bu kod 5 dakika geçerlidir.`
  } else {
    message = `RandevuAI doğrulama kodunuz: ${code}. Bu kod 5 dakika geçerlidir.`
  }
  
  return sendSMS({ phone, message, tenantId })
}

/**
 * Randevu hatırlatma SMS'i gönder
 */
export async function sendBookingReminder(
  phone: string,
  bookingDetails: {
    customerName: string
    serviceName: string
    date: string
    time: string
    businessName: string
    hoursBefore: number
  },
  tenantId?: string,
  bookingId?: string,
  customerId?: string
): Promise<SMSResult> {
  const { customerName, serviceName, date, time, businessName, hoursBefore } = bookingDetails

  if (!tenantId) {
    // Fallback to hardcoded template
    const message = `Merhaba ${customerName},\n\n` +
      `${hoursBefore} saat sonra randevunuz var!\n\n` +
      `Hizmet: ${serviceName}\n` +
      `Tarih: ${date}\n` +
      `Saat: ${time}\n` +
      `Yer: ${businessName}\n\n` +
      `Lütfen zamanında gelmeye özen gösterin.`
    return sendSMS({ phone, message, tenantId, bookingId, customerId })
  }

  // Use template service
  const { smsTemplateService } = await import('./template-service')
  
  let message: string | null = null
  
  if (hoursBefore === 24) {
    message = await smsTemplateService.formatBookingReminder24h(tenantId, {
      customerName,
      serviceName,
      date,
      time,
      businessName
    })
  } else if (hoursBefore === 1) {
    message = await smsTemplateService.formatBookingReminder1h(tenantId, {
      customerName,
      serviceName,
      time,
      businessName
    })
  }

  // Fallback if template not found
  if (!message) {
    message = `Merhaba ${customerName}, ${hoursBefore} saat sonra randevunuz var: ${serviceName} - ${date} ${time}. ${businessName}`
  }

  return sendSMS({ phone, message, tenantId, bookingId, customerId })
}

/**
 * Randevu onay SMS'i gönder
 */
export async function sendBookingConfirmation(
  phone: string,
  bookingDetails: {
    customerName: string
    serviceName: string
    date: string
    time: string
    staffName?: string
    businessName: string
    confirmationCode?: string
  },
  tenantId?: string,
  bookingId?: string,
  customerId?: string
): Promise<SMSResult> {
  const { customerName, serviceName, date, time, staffName, businessName, confirmationCode } = bookingDetails

  if (!tenantId || !confirmationCode) {
    // Fallback to hardcoded template
    let message = `Merhaba ${customerName},\n\n` +
      `Randevunuz onaylandı!\n\n` +
      `Hizmet: ${serviceName}\n` +
      `Tarih: ${date}\n` +
      `Saat: ${time}\n`

    if (staffName) {
      message += `Personel: ${staffName}\n`
    }

    message += `Yer: ${businessName}\n\n`

    if (confirmationCode) {
      message += `Onay Kodu: ${confirmationCode}\n\n`
    }

    message += `İyi günler dileriz!`

    return sendSMS({ phone, message, tenantId, bookingId, customerId })
  }

  // Use template service
  const { smsTemplateService } = await import('./template-service')
  
  const message = await smsTemplateService.formatBookingConfirmation(tenantId, {
    customerName,
    serviceName,
    date,
    time,
    confirmationCode,
    staffName,
    businessName
  })

  // Fallback if template not found
  if (!message) {
    return sendSMS({ phone, message: `Merhaba ${customerName}, ${serviceName} randevunuz ${date} ${time} için alındı. Onay kodunuz: ${confirmationCode}. ${businessName}`, tenantId, bookingId, customerId })
  }

  return sendSMS({ phone, message, tenantId, bookingId, customerId })
}

/**
 * Kampanya SMS'i gönder
 */
export async function sendCampaignSMS(
  phone: string,
  content: string,
  businessName: string,
  tenantId?: string,
  customerId?: string
): Promise<SMSResult> {
  const message = `${content}\n\nSaygılarımızla,\n${businessName}`
  return sendSMS({ phone, message, tenantId, customerId })
}
