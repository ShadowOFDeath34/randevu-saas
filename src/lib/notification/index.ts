export type NotificationChannel = 'email' | 'sms' | 'whatsapp'

export interface SendEmailParams {
  to: string
  subject: string
  html: string
  text?: string
}

export interface SendSMSParams {
  to: string
  message: string
}

export interface SendWhatsAppParams {
  to: string
  templateName: string
  parameters: Record<string, string>
}

export interface NotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

class EmailProvider {
  async send(params: SendEmailParams): Promise<NotificationResult> {
    if (!process.env.RESEND_API_KEY) {
      console.log('[Email Mock]', params)
      return { success: true, messageId: `mock_${Date.now()}` }
    }

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'noreply@randevuai.com',
          to: params.to,
          subject: params.subject,
          html: params.html,
          text: params.text
        })
      })

      if (!res.ok) {
        throw new Error('Resend API error')
      }

      const data = await res.json()
      return { success: true, messageId: data.id }
    } catch (error: any) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }
  }
}

class SMSProvider {
  async send(params: SendSMSParams): Promise<NotificationResult> {
    if (!process.env.NETGSM_API_KEY) {
      console.log('[SMS Mock]', params)
      return { success: true, messageId: `mock_sms_${Date.now()}` }
    }

    try {
      const formData = new URLSearchParams()
      formData.append('username', process.env.NETGSM_USER || '')
      formData.append('password', process.env.NETGSM_PASS || '')
      formData.append('source', process.env.NETGSM_ORIGINATOR || 'RandevuAI')
      formData.append('target', params.to)
      formData.append('message', params.message)

      const res = await fetch('https://api.netgsm.com.tr/sms/send/get', {
        method: 'POST',
        body: formData
      })

      const text = await res.text()
      
      if (text.includes('00')) {
        return { success: true, messageId: text }
      }
      
      return { success: false, error: text }
    } catch (error: any) {
      console.error('SMS send error:', error)
      return { success: false, error: error.message }
    }
  }
}

class WhatsAppProvider {
  async send(params: SendWhatsAppParams): Promise<NotificationResult> {
    if (!process.env.TWILIO_ACCOUNT_SID) {
      console.log('[WhatsApp Mock]', params)
      return { success: true, messageId: `mock_wa_${Date.now()}` }
    }

    try {
      const twilio = require('twilio')(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      const message = await twilio.messages.create({
        body: this.formatTemplate(params.templateName, params.parameters),
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: `whatsapp:${params.to}`
      })

      return { success: true, messageId: message.sid }
    } catch (error: any) {
      console.error('WhatsApp send error:', error)
      return { success: false, error: error.message }
    }
  }

  private formatTemplate(template: string, params: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
  }
}

export class NotificationService {
  private emailProvider = new EmailProvider()
  private smsProvider = new SMSProvider()
  private whatsAppProvider = new WhatsAppProvider()

  async sendEmail(params: SendEmailParams): Promise<NotificationResult> {
    return this.emailProvider.send(params)
  }

  async sendSMS(params: SendSMSParams): Promise<NotificationResult> {
    return this.smsProvider.send(params)
  }

  async sendWhatsApp(params: SendWhatsAppParams): Promise<NotificationResult> {
    return this.whatsAppProvider.send(params)
  }

  async sendBookingConfirmation(booking: any, customer: any): Promise<void> {
    const template = this.getTemplate('booking_confirmation')
    
    await this.sendEmail({
      to: customer.email || 'noemail@example.com',
      subject: 'Randevunuz Onaylandı',
      html: this.formatTemplate(template.email, {
        customerName: customer.fullName,
        serviceName: booking.service?.name || '',
        date: booking.bookingDate,
        time: booking.startTime,
        businessName: booking.tenant?.businessProfile?.businessName || ''
      })
    })

    await this.sendSMS({
      to: customer.phone,
      message: this.formatTemplate(template.sms, {
        customerName: customer.fullName,
        serviceName: booking.service?.name || '',
        date: booking.bookingDate,
        time: booking.startTime
      })
    })
  }

  async sendBookingReminder(booking: any, customer: any, hoursBefore: number): Promise<void> {
    const template = this.getTemplate('booking_reminder')
    
    await this.sendEmail({
      to: customer.email || 'noemail@example.com',
      subject: `Hatırlatma: ${hoursBefore} saat sonra randevunuz var`,
      html: this.formatTemplate(template.email, {
        customerName: customer.fullName,
        serviceName: booking.service?.name || '',
        date: booking.bookingDate,
        time: booking.startTime,
        hoursBefore: hoursBefore.toString()
      })
    })
  }

  async sendBookingCancelled(booking: any, customer: any): Promise<void> {
    const template = this.getTemplate('booking_cancelled')
    
    await this.sendEmail({
      to: customer.email || 'noemail@example.com',
      subject: 'Randevunuz İptal Edildi',
      html: this.formatTemplate(template.email, {
        customerName: customer.fullName,
        serviceName: booking.service?.name || '',
        date: booking.bookingDate,
        time: booking.startTime
      })
    })
  }

  async sendReviewRequest(booking: any, customer: any): Promise<void> {
    const template = this.getTemplate('review_request')
    
    const reviewLink = `${process.env.NEXT_PUBLIC_APP_URL}/review/${booking.confirmationCode}`
    
    await this.sendEmail({
      to: customer.email || 'noemail@example.com',
      subject: 'Deneyiminizi paylaşır mısınız?',
      html: this.formatTemplate(template.email, {
        customerName: customer.fullName,
        serviceName: booking.service?.name || '',
        reviewLink
      })
    })
  }

  private getTemplate(type: string): { email: string; sms: string } {
    const templates: Record<string, { email: string; sms: string }> = {
      booking_confirmation: {
        email: `
          <h2>Randevunuz Onaylandı!</h2>
          <p>Merhaba {{customerName}},</p>
          <p>Randevunuz başarıyla oluşturuldu.</p>
          <ul>
            <li><strong>Hizmet:</strong> {{serviceName}}</li>
            <li><strong>Tarih:</strong> {{date}}</li>
            <li><strong>Saat:</strong> {{time}}</li>
          </ul>
          <p>Saygılarımızla,<br>{{businessName}}</p>
        `,
        sms: `Merhaba {{customerName}}, randevunuz onaylandi. {{serviceName}} - {{date}} {{time}}`
      },
      booking_reminder: {
        email: `
          <h2>Randevu Hatırlatması</h2>
          <p>Merhaba {{customerName}},</p>
          <p>{{hoursBefore}} saat sonra randevunuz var!</p>
          <ul>
            <li><strong>Hizmet:</strong> {{serviceName}}</li>
            <li><strong>Tarih:</strong> {{date}}</li>
            <li><strong>Saat:</strong> {{time}}</li>
          </ul>
          <p>Görüşmek üzere!</p>
        `,
        sms: `Merhaba {{customerName}}, {{hoursBefore}} saat icinde randevunuz var: {{serviceName}} - {{date}} {{time}}`
      },
      booking_cancelled: {
        email: `
          <h2>Randevu İptal Edildi</h2>
          <p>Merhaba {{customerName}},</p>
          <p>Randevunuz iptal edilmiştir.</p>
          <ul>
            <li><strong>Hizmet:</strong> {{serviceName}}</li>
            <li><strong>Tarih:</strong> {{date}}</li>
            <li><strong>Saat:</strong> {{time}}</li>
          </ul>
        `,
        sms: `Merhaba {{customerName}}, randevunuz iptal edilmistir. {{serviceName}} - {{date}} {{time}}`
      },
      review_request: {
        email: `
          <h2>Deneyiminizi paylaşır mısınız?</h2>
          <p>Merhaba {{customerName}},</p>
          <p>Geçen hafta {{serviceName}} hizmetimizi kullandınız.</p>
          <p>Deneyiminizi paylaşmak için aşağıdaki linke tıklayın:</p>
          <p><a href="{{reviewLink}}">Değerlendirme Yap</a></p>
          <p>Görüşleriniz bizim için çok değerli!</p>
        `,
        sms: `Merhaba {{customerName}}, deneyiminizi paylasmak ister misiniz? {{reviewLink}}`
      }
    }

    return templates[type] || templates.booking_confirmation
  }

  private formatTemplate(template: string, params: Record<string, string>): string {
    let result = template
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }
    return result
  }
}

export const notificationService = new NotificationService()
