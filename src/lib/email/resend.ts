/**
 * Resend Email API Entegrasyonu
 * Dokümantasyon: https://resend.com/docs
 */

import { Resend } from 'resend'

if (!process.env.RESEND_API_KEY) {
  console.warn('RESEND_API_KEY tanımlanmamış. E-posta gönderimi mock modda çalışacak.')
}

export const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export const EMAIL_FROM = process.env.EMAIL_FROM || 'onay@randevuai.com'
export const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || 'RandevuAI'
