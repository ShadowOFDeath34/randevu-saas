import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { sendSMS } from '@/lib/sms'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { campaignId } = await req.json()

    if (!campaignId) {
      return NextResponse.json({ error: 'Kampanya ID gerekli' }, { status: 400 })
    }

    const campaign = await db.campaign.findUnique({
      where: { id: campaignId, tenantId: session.user.tenantId }
    })

    if (!campaign) {
      return NextResponse.json({ error: 'Kampanya bulunamadı' }, { status: 404 })
    }

    if (campaign.status === 'sent') {
      return NextResponse.json({ error: 'Bu kampanya zaten gönderilmiş' }, { status: 400 })
    }

    // Müşterileri segmentine göre bul
    let customers = []
    if (campaign.targetSegment === 'all') {
      customers = await db.customer.findMany({
        where: { tenantId: session.user.tenantId }
      })
    } else {
      // In a real app we'd map this, but for MVP let's assume `customerSegment` matches
      customers = await db.customer.findMany({
        where: { 
          tenantId: session.user.tenantId,
          customerSegment: campaign.targetSegment
        }
      })
    }

    // Filter by channel capability
    let targetCustomers = []
    if (campaign.type === 'sms') {
      targetCustomers = customers.filter(c => c.phone)
    } else {
      targetCustomers = customers.filter(c => c.email)
    }

    // Send notifications (async, non-blocking)
    const sendPromises = targetCustomers.map(async (customer) => {
      try {
        if (campaign.type === 'sms' && customer.phone) {
          await sendSMS({
            phone: customer.phone,
            message: campaign.content,
            tenantId: session.user.tenantId,
            customerId: customer.id
          })
        } else if (campaign.type === 'email' && customer.email) {
          await sendEmail({
            to: customer.email,
            subject: campaign.name,
            html: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>${campaign.name}</h2>
              <p>${campaign.content}</p>
              <hr/>
              <p style="color: #666; font-size: 12px;">Bu mesaj ${campaign.aiGenerated ? 'AI tarafından optimize edilerek' : ''} gönderilmiştir.</p>
            </div>`,
            tenantId: session.user.tenantId,
            customerId: customer.id
          })
        }
        return { success: true, customerId: customer.id }
      } catch (err) {
        console.error(`Failed to send to ${customer.id}:`, err)
        return { success: false, customerId: customer.id, error: err }
      }
    })

    // Wait for all sends to complete
    const results = await Promise.all(sendPromises)
    const successfulSends = results.filter(r => r.success).length

    // Update campaign status
    await db.campaign.update({
      where: { id: campaign.id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        sentCount: successfulSends
      }
    })

    return NextResponse.json({ 
      success: true, 
      sentCount: targetCustomers.length 
    })
  } catch (error: any) {
    console.error('Error sending campaign:', error)
    return NextResponse.json({ error: 'Gönderim sırasında hata oluştu' }, { status: 500 })
  }
}
