import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { NotificationChannel } from '@prisma/client'

// Default SMS templates
const defaultTemplates = [
  {
    type: 'booking_confirmation',
    title: 'Randevu Onayı',
    body: 'Merhaba {{customerName}}, {{serviceName}} randevunuz {{date}} {{time}} için alındı. Onay kodunuz: {{confirmationCode}}. {{businessName}}',
    isActive: true
  },
  {
    type: 'booking_reminder_24h',
    title: '24 Saat Hatırlatma',
    body: 'Merhaba {{customerName}}, yarın {{time}}\'de {{serviceName}} randevunuz var. Bizi tercih ettiğiniz için teşekkürler! {{businessName}}',
    isActive: true
  },
  {
    type: 'booking_reminder_1h',
    title: '1 Saat Hatırlatma',
    body: 'Merhaba {{customerName}}, 1 saat içinde {{serviceName}} randevunuz var. {{businessName}}',
    isActive: true
  },
  {
    type: 'booking_cancelled',
    title: 'Randevu İptali',
    body: 'Merhaba {{customerName}}, {{date}} {{time}} tarihli {{serviceName}} randevunuz iptal edildi. {{businessName}}',
    isActive: true
  },
  {
    type: 'booking_updated',
    title: 'Randevu Güncelleme',
    body: 'Merhaba {{customerName}}, randevunuz güncellendi. Yeni bilgiler: {{date}} {{time}}, {{serviceName}}. {{businessName}}',
    isActive: true
  },
  {
    type: 'kiosk_welcome',
    title: 'Kiosk Giriş',
    body: 'Merhaba {{customerName}}, {{businessName}} girişiniz kaydedildi. Sıranız alındı, kısa sürede hizmet verilecektir.',
    isActive: true
  },
  {
    type: 'verification_code',
    title: 'Doğrulama Kodu',
    body: '{{businessName}} doğrulama kodunuz: {{code}}. Bu kod 5 dakika geçerlidir.',
    isActive: true
  }
]

// Available variables for each template type
export const templateVariables: Record<string, Array<{key: string, label: string, description: string}>> = {
  booking_confirmation: [
    { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
    { key: 'serviceName', label: 'Hizmet Adı', description: 'Randevu alınan hizmet' },
    { key: 'date', label: 'Tarih', description: 'Randevu tarihi (GG.AA.YYYY)' },
    { key: 'time', label: 'Saat', description: 'Randevu saati' },
    { key: 'confirmationCode', label: 'Onay Kodu', description: 'Randevu onay kodu' },
    { key: 'staffName', label: 'Personel', description: 'Atanan personel' },
    { key: 'businessName', label: 'İşletme', description: 'İşletme adı' }
  ],
  booking_reminder_24h: [
    { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
    { key: 'serviceName', label: 'Hizmet Adı', description: 'Randevu alınan hizmet' },
    { key: 'date', label: 'Tarih', description: 'Randevu tarihi' },
    { key: 'time', label: 'Saat', description: 'Randevu saati' },
    { key: 'businessName', label: 'İşletme', description: 'İşletme adı' }
  ],
  booking_reminder_1h: [
    { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
    { key: 'serviceName', label: 'Hizmet Adı', description: 'Randevu alınan hizmet' },
    { key: 'time', label: 'Saat', description: 'Randevu saati' },
    { key: 'businessName', label: 'İşletme', description: 'İşletme adı' }
  ],
  booking_cancelled: [
    { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
    { key: 'serviceName', label: 'Hizmet Adı', description: 'İptal edilen hizmet' },
    { key: 'date', label: 'Tarih', description: 'Randevu tarihi' },
    { key: 'time', label: 'Saat', description: 'Randevu saati' },
    { key: 'businessName', label: 'İşletme', description: 'İşletme adı' }
  ],
  booking_updated: [
    { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
    { key: 'serviceName', label: 'Hizmet Adı', description: 'Güncellenen hizmet' },
    { key: 'date', label: 'Yeni Tarih', description: 'Yeni randevu tarihi' },
    { key: 'time', label: 'Yeni Saat', description: 'Yeni randevu saati' },
    { key: 'businessName', label: 'İşletme', description: 'İşletme adı' }
  ],
  kiosk_welcome: [
    { key: 'customerName', label: 'Müşteri Adı', description: 'Müşterinin tam adı' },
    { key: 'businessName', label: 'İşletme', description: 'İşletme adı' }
  ],
  verification_code: [
    { key: 'code', label: 'Doğrulama Kodu', description: 'SMS doğrulama kodu' },
    { key: 'businessName', label: 'İşletme', description: 'İşletme adı' }
  ]
}

export async function GET() {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await db.notificationTemplate.findMany({
      where: { 
        tenantId: session.user.tenantId,
        channel: NotificationChannel.sms
      },
      orderBy: { type: 'asc' }
    })

    // If no templates exist, create defaults
    if (templates.length === 0) {
      const created = await Promise.all(
        defaultTemplates.map(t => 
          db.notificationTemplate.create({
            data: {
              tenantId: session.user.tenantId,
              type: t.type,
              channel: NotificationChannel.sms,
              title: t.title,
              body: t.body,
              isActive: t.isActive
            }
          })
        )
      )
      return NextResponse.json({ 
        templates: created,
        variables: templateVariables 
      })
    }

    return NextResponse.json({ 
      templates,
      variables: templateVariables 
    })
  } catch (error) {
    console.error('Error fetching SMS templates:', error)
    return NextResponse.json({ error: 'Error fetching templates' }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, body, isActive } = await req.json()

    if (!id) {
      return NextResponse.json({ error: 'Template ID required' }, { status: 400 })
    }

    const template = await db.notificationTemplate.update({
      where: { 
        id,
        tenantId: session.user.tenantId 
      },
      data: {
        body,
        isActive
      }
    })

    return NextResponse.json({ template })
  } catch (error) {
    console.error('Error updating SMS template:', error)
    return NextResponse.json({ error: 'Error updating template' }, { status: 500 })
  }
}

// Reset templates to defaults
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    if (action === 'reset') {
      // Delete existing SMS templates
      await db.notificationTemplate.deleteMany({
        where: { 
          tenantId: session.user.tenantId,
          channel: NotificationChannel.sms
        }
      })

      // Create defaults
      const created = await Promise.all(
        defaultTemplates.map(t => 
          db.notificationTemplate.create({
            data: {
              tenantId: session.user.tenantId,
              type: t.type,
              channel: NotificationChannel.sms,
              title: t.title,
              body: t.body,
              isActive: t.isActive
            }
          })
        )
      )

      return NextResponse.json({ templates: created })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Error resetting SMS templates:', error)
    return NextResponse.json({ error: 'Error resetting templates' }, { status: 500 })
  }
}