/**
 * Email Service - Ana modül
 * Resend entegrasyonu ve template sistemi
 */

import { resend, EMAIL_FROM, EMAIL_FROM_NAME } from './resend'
import { db } from '@/lib/db'

export interface EmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
  tenantId?: string
  bookingId?: string
  customerId?: string
}

const MAX_RETRIES = 3
const RETRY_DELAY = 1000 // ms

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function sendWithRetry(
  params: SendEmailParams,
  attempt: number = 1
): Promise<EmailResult> {
  try {
    // Mock mod - eğer Resend yapılandırılmamışsa
    if (!resend) {
      console.log('Mock e-posta gönderildi:', {
        to: params.to,
        subject: params.subject
      })
      return { success: true, messageId: 'MOCK-' + Date.now() }
    }

    const { data, error } = await resend.emails.send({
      from: `${EMAIL_FROM_NAME} <${EMAIL_FROM}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    })

    if (error) {
      throw new Error(error.message)
    }

    // Log to database
    if (params.tenantId) {
      await db.notificationLog.create({
        data: {
          tenantId: params.tenantId,
          bookingId: params.bookingId,
          customerId: params.customerId,
          channel: 'email',
          status: 'sent',
          payload: JSON.stringify({
            to: params.to,
            subject: params.subject,
            messageId: data?.id,
          }),
          sentAt: new Date(),
        },
      })
    }

    return { success: true, messageId: data?.id }
  } catch (error: unknown) {
    console.error(`E-posta gönderme denemesi ${attempt} başarısız:`, error)

    if (attempt < MAX_RETRIES) {
      await sleep(RETRY_DELAY * attempt)
      return sendWithRetry(params, attempt + 1)
    }

    // Log failure
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    if (params.tenantId) {
      await db.notificationLog.create({
        data: {
          tenantId: params.tenantId,
          bookingId: params.bookingId,
          customerId: params.customerId,
          channel: 'email',
          status: 'failed',
          payload: JSON.stringify({
            to: params.to,
            subject: params.subject,
            error: errorMessage,
          }),
          sentAt: new Date(),
        },
      })
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * XSS korumasi - HTML escape fonksiyonu
 * Kullanici girdilerini HTML'e guvenli sekilde encode eder
 */
function escapeHtml(text: string | null | undefined): string {
  if (!text) return ''
  
  return text
    .replace(/\u0026/g, '\u0026amp;')
    .replace(/\u003c/g, '\u0026lt;')
    .replace(/\u003e/g, '\u0026gt;')
    .replace(/"/g, '\u0026quot;')
    .replace(/'/g, '\u0026#039;')
}

/**
 * URL validasyonu - sadece http/https URL'lerine izin ver
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return '#'
  
  // Sadece http:// veya https:// ile baslayan URL'lere izin ver
  if (!url.match(/^https?:\/\//i)) {
    return '#'
  }
  
  // XSS onlemi: javascript: ve data: protokollerini engelle
  if (url.match(/^(javascript|data|vbscript):/i)) {
    return '#'
  }
  
  return escapeHtml(url)
}

export async function sendEmail(params: SendEmailParams): Promise<EmailResult> {
  return sendWithRetry(params)
}

// Template fonksiyonları
export async function sendBookingConfirmationEmail(
  to: string,
  data: {
    customerName: string
    serviceName: string
    date: string
    time: string
    staffName?: string
    businessName: string
    confirmationCode?: string
    manageLink?: string
  },
  tenantId?: string,
  bookingId?: string,
  customerId?: string
): Promise<EmailResult> {
  const { customerName, serviceName, date, time, staffName, businessName, confirmationCode, manageLink } = data

  const subject = `Randevunuz Onaylandı - ${businessName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Randevu Onayı</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Randevunuz Onaylandı!</h1>
        </div>
        <div style="padding: 30px;">
          <p>Merhaba <strong>${customerName}</strong>,</p>
          <p>Randevunuz başarıyla oluşturuldu. İşte detaylar:</p>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 600; color: #6b7280;">Hizmet:</span>
              <span>${serviceName}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 600; color: #6b7280;">Tarih:</span>
              <span>${date}</span>
            </div>
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 600; color: #6b7280;">Saat:</span>
              <span>${time}</span>
            </div>
            ${staffName ? `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb;">
              <span style="font-weight: 600; color: #6b7280;">Personel:</span>
              <span>${staffName}</span>
            </div>
            ` : ''}
            ${confirmationCode ? `
            <div style="display: flex; justify-content: space-between; padding: 10px 0;">
              <span style="font-weight: 600; color: #6b7280;">Onay Kodu:</span>
              <span style="font-family: monospace; font-size: 18px; letter-spacing: 2px;">${confirmationCode}</span>
            </div>
            ` : ''}
          </div>

          ${manageLink ? `
          <p style="text-align: center;">
            <a href="${manageLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px;">Randevumu Yönet</a>
          </p>
          ` : ''}

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            <p>Saygılarımızla,<br><strong>${businessName}</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Merhaba ${customerName},

Randevunuz onaylandı!

Hizmet: ${serviceName}
Tarih: ${date}
Saat: ${time}
${staffName ? `Personel: ${staffName}\n` : ''}
${confirmationCode ? `Onay Kodu: ${confirmationCode}\n` : ''}

Saygılarımızla,
${businessName}
  `.trim()

  return sendEmail({ to, subject, html, text, tenantId, bookingId, customerId })
}

export async function sendBookingReminderEmail(
  to: string,
  data: {
    customerName: string
    serviceName: string
    date: string
    time: string
    hoursBefore: number
    businessName: string
  },
  tenantId?: string,
  bookingId?: string,
  customerId?: string
): Promise<EmailResult> {
  const { customerName, serviceName, date, time, hoursBefore, businessName } = data

  const subject = `Hatırlatma: ${hoursBefore} saat sonra randevunuz var`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Randevu Hatırlatması</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Hatırlatma!</h1>
        </div>
        <div style="padding: 30px;">
          <p>Merhaba <strong>${customerName}</strong>,</p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>${hoursBefore} saat sonra</strong> randevunuz var!
          </div>

          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Hizmet:</strong> ${serviceName}
            </div>
            <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Tarih:</strong> ${date}
            </div>
            <div style="padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
              <strong>Saat:</strong> ${time}
            </div>
            <div style="padding: 8px 0;">
              <strong>Yer:</strong> ${businessName}
            </div>
          </div>

          <p>Lütfen zamanında gelmeye özen gösterin. Randevunuzu iptal etmeniz gerekiyorsa lütfen önceden haber verin.</p>

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            <p>Saygılarımızla,<br><strong>${businessName}</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Merhaba ${customerName},

${hoursBefore} saat sonra randevunuz var!

Hizmet: ${serviceName}
Tarih: ${date}
Saat: ${time}
Yer: ${businessName}

Lütfen zamanında gelmeye özen gösterin.

Saygılarımızla,
${businessName}
  `.trim()

  return sendEmail({ to, subject, html, text, tenantId, bookingId, customerId })
}

export async function sendWelcomeEmail(
  to: string,
  data: {
    name: string
    businessName: string
    dashboardLink: string
  },
  tenantId?: string,
  customerId?: string
): Promise<EmailResult> {
  const { name, businessName, dashboardLink } = data

  const subject = `Hoşgeldiniz - ${businessName}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Hoşgeldiniz</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">Hoşgeldiniz!</h1>
        </div>
        <div style="padding: 40px;">
          <p>Merhaba <strong>${name}</strong>,</p>
          <p><strong>${businessName}</strong> olarak RandevuAI'a katıldığınız için teşekkür ederiz!</p>

          <p style="text-align: center;">
            <a href="${dashboardLink}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Panele Git</a>
          </p>

          <div style="margin: 30px 0;">
            <h3>Neler yapabilirsiniz?</h3>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">Randevularınızı yönetin</div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">Müşterilerinizi takip edin</div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">Personel takvimi oluşturun</div>
            <div style="background: white; padding: 15px; border-radius: 8px; margin: 10px 0;">Otomatik hatırlatmalar gönderin</div>
          </div>

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            <p>Herhangi bir sorunuz varsa bize ulaşmaktan çekinmeyin.</p>
            <p>Saygılarımızla,<br><strong>RandevuAI Ekibi</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Merhaba ${name},

${businessName} olarak RandevuAI'a hoşgeldiniz!

Panele gitmek için: ${dashboardLink}

Neler yapabilirsiniz?
- Randevularınızı yönetin
- Müşterilerinizi takip edin
- Personel takvimi oluşturun
- Otomatik hatırlatmalar gönderin

Saygılarımızla,
RandevuAI Ekibi
  `.trim()

  return sendEmail({ to, subject, html, text, tenantId, customerId })
}

export async function sendResetPasswordEmail(
  to: string,
  data: {
    name: string
    resetUrl: string
  },
  tenantId?: string,
  customerId?: string
): Promise<EmailResult> {
  const { name, resetUrl } = data

  const subject = 'Şifre Sıfırlama İsteği'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Şifre Sıfırlama</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 10px; overflow: hidden;">
        <div style="background: #1f2937; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Şifre Sıfırlama</h1>
        </div>
        <div style="padding: 30px;">
          <p>Merhaba <strong>${name}</strong>,</p>
          <p>Şifrenizi sıfırlamak için bir istekte bulundunuz. Aşağıdaki butona tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>

          <p style="text-align: center;">
            <a href="${resetUrl}" style="display: inline-block; background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; margin: 20px 0;">Şifremi Sıfırla</a>
          </p>

          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; font-size: 14px;">
            <strong>Önemli:</strong> Bu bağlantı 1 saat boyunca geçerlidir. Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.
          </div>

          <p>Veya şu bağlantıyı kullanabilirsiniz:</p>
          <p style="word-break: break-all; font-size: 14px; color: #6b7280;">${resetUrl}</p>

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            <p>Saygılarımızla,<br><strong>RandevuAI</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Merhaba ${name},

Şifrenizi sıfırlamak için aşağıdaki bağlantıya tıklayın:

${resetUrl}

Bu bağlantı 1 saat boyunca geçerlidir.

Eğer bu isteği siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.

Saygılarımızla,
RandevuAI
  `.trim()

  return sendEmail({ to, subject, html, text, tenantId, customerId })
}

export async function sendBookingStatusEmail(
  to: string,
  data: {
    customerName: string
    status: string
    bookingDate: string
    bookingTime: string
    businessName?: string
  },
  tenantId?: string,
  bookingId?: string,
  customerId?: string
): Promise<EmailResult> {
  const { customerName, status, bookingDate, bookingTime, businessName = 'RandevuAI' } = data

  const isConfirmed = status === 'confirmed'
  const subject = isConfirmed
    ? `Randevunuz Onaylandı - ${businessName}`
    : `Randevunuz İptal Edildi - ${businessName}`

  const statusText = isConfirmed ? 'onaylandı' : 'iptal edildi'
  const statusColor = isConfirmed ? '#10b981' : '#ef4444'
  const bgColor = isConfirmed ? '#d1fae5' : '#fee2e2'

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Randevu Durum Güncellemesi</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: #f9fafb; border-radius: 10px; overflow: hidden;">
        <div style="background: ${statusColor}; padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">
            ${isConfirmed ? '✓ Randevunuz Onaylandı!' : '✗ Randevunuz İptal Edildi'}
          </h1>
        </div>
        <div style="padding: 30px;">
          <p>Merhaba <strong>${customerName}</strong>,</p>
          <p>${bookingDate} ${bookingTime} tarihli randevunuz <strong>${statusText}</strong>.</p>

          <div style="background: ${bgColor}; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <strong>Randevu Detayları:</strong><br>
            Tarih: ${bookingDate}<br>
            Saat: ${bookingTime}<br>
            Durum: ${isConfirmed ? 'Onaylandı' : 'İptal Edildi'}
          </div>

          ${isConfirmed ? `
          <p>Randevunuza zamanında gelmeyi unutmayın. Herhangi bir değişiklik yapmanız gerekiyorsa lütfen önceden haber verin.</p>
          ` : `
          <p>Randevunuz iptal edildi. Yeni bir randevu almak isterseniz bize ulaşabilirsiniz.</p>
          `}

          <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
            <p>Saygılarımızla,<br><strong>${businessName}</strong></p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `

  const text = `
Merhaba ${customerName},

${bookingDate} ${bookingTime} tarihli randevunuz ${statusText}.

${isConfirmed ? 'Randevunuza zamanında gelmeyi unutmayın.' : 'Yeni bir randevu almak için bize ulaşabilirsiniz.'}

Saygılarımızla,
${businessName}
  `.trim()

  return sendEmail({ to, subject, html, text, tenantId, bookingId, customerId })
}
