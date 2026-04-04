import { db } from '@/lib/db'
import { NotificationChannel } from '@prisma/client'

export interface TemplateVariables {
  customerName?: string
  serviceName?: string
  date?: string
  time?: string
  confirmationCode?: string
  staffName?: string
  businessName?: string
  code?: string
  [key: string]: string | undefined
}

class SMSTemplateService {
  /**
   * Get SMS template by type for a tenant
   */
  async getTemplate(tenantId: string, type: string) {
    const template = await db.notificationTemplate.findFirst({
      where: {
        tenantId,
        type,
        channel: NotificationChannel.sms,
        isActive: true
      }
    })

    return template
  }

  /**
   * Get all active SMS templates for a tenant
   */
  async getAllTemplates(tenantId: string) {
    const templates = await db.notificationTemplate.findMany({
      where: {
        tenantId,
        channel: NotificationChannel.sms,
        isActive: true
      },
      orderBy: { type: 'asc' }
    })

    return templates
  }

  /**
   * Format template with variables
   */
  formatTemplate(template: string, variables: TemplateVariables): string {
    let result = template
    
    // Replace all {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
      if (value !== undefined && value !== null) {
        result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
      }
    }

    // Remove any remaining unreplaced variables
    result = result.replace(/\{\{[^}]+\}\}/g, '')

    return result.trim()
  }

  /**
   * Format template for booking confirmation
   */
  async formatBookingConfirmation(
    tenantId: string,
    variables: {
      customerName: string
      serviceName: string
      date: string
      time: string
      confirmationCode: string
      staffName?: string
      businessName: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'booking_confirmation')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Format template for booking reminder (24h)
   */
  async formatBookingReminder24h(
    tenantId: string,
    variables: {
      customerName: string
      serviceName: string
      date: string
      time: string
      businessName: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'booking_reminder_24h')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Format template for booking reminder (1h)
   */
  async formatBookingReminder1h(
    tenantId: string,
    variables: {
      customerName: string
      serviceName: string
      time: string
      businessName: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'booking_reminder_1h')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Format template for booking cancellation
   */
  async formatBookingCancellation(
    tenantId: string,
    variables: {
      customerName: string
      serviceName: string
      date: string
      time: string
      businessName: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'booking_cancelled')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Format template for booking update
   */
  async formatBookingUpdate(
    tenantId: string,
    variables: {
      customerName: string
      serviceName: string
      date: string
      time: string
      businessName: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'booking_updated')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Format template for kiosk welcome
   */
  async formatKioskWelcome(
    tenantId: string,
    variables: {
      customerName: string
      businessName: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'kiosk_welcome')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Format template for verification code
   */
  async formatVerificationCode(
    tenantId: string,
    variables: {
      code: string
      businessName: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'verification_code')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Format template for review request
   */
  async formatReviewRequest(
    tenantId: string,
    variables: {
      customerName: string
      serviceName: string
      businessName: string
      reviewLink: string
    }
  ): Promise<string | null> {
    const template = await this.getTemplate(tenantId, 'review_request')
    if (!template) return null

    return this.formatTemplate(template.body, variables)
  }

  /**
   * Validate template variables
   * Returns array of missing required variables
   */
  validateTemplate(template: string, providedVars: string[]): string[] {
    // Extract all {{variable}} patterns
    const matches = template.match(/\{\{([^}]+)\}\}/g) || []
    const required = matches.map(m => m.replace(/[\{\}]/g, ''))
    
    // Find missing variables
    const missing = required.filter(v => !providedVars.includes(v))
    
    return [...new Set(missing)] // Remove duplicates
  }

  /**
   * Calculate SMS character count and segments
   * Turkish SMS: 1 segment = 70 chars (Unicode), 160 chars (GSM-7)
   */
  calculateSMSStats(message: string): { chars: number; segments: number } {
    const hasUnicode = /[^\u0000-\u007F]/.test(message)
    const maxChars = hasUnicode ? 70 : 160
    const chars = message.length
    const segments = Math.ceil(chars / maxChars)
    
    return { chars, segments }
  }
}

export const smsTemplateService = new SMSTemplateService()