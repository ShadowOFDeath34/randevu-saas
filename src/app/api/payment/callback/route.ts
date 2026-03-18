import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { status, paymentId } = body

    // Extract tenant and plan info from conversationId or query params
    const { searchParams } = new URL(req.url)
    const planId = searchParams.get('plan')
    const tenantId = searchParams.get('tenant')

    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant ID required' }, { status: 400 })
    }

    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: { users: { take: 1 } }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    if (status === 'success' || body.status === 'SUCCESS') {
      // Update subscription to active
      await db.subscription.updateMany({
        where: {
          tenantId,
          status: 'pending'
        },
        data: {
          status: 'active',
          externalSubscriptionId: paymentId
        }
      })

      // Create invoice record
      await db.invoice.create({
        data: {
          tenantId,
          subscriptionId: tenantId, // This should be actual subscription ID
          amount: 1, // Get from plan
          currency: 'TRY',
          status: 'paid',
          dueDate: new Date(),
          paidAt: new Date(),
          invoiceNumber: `INV-${Date.now()}`,
          description: `Abonelik ödemesi - ${planId || 'Plan'}`
        }
      })

      // Send confirmation to business owner
      const owner = tenant.users[0]
      if (owner?.email) {
        await sendEmail({
          to: owner.email,
          subject: 'Ödemeniz Başarıyla Alındı - RandevuAI',
          html: `
            <h1>Teşekkürler!</h1>
            <p>Abonelik ödemeniz başarıyla alındı.</p>
            <p>Plan: ${planId}</p>
            <p>Ödeme ID: ${paymentId}</p>
          `,
          tenantId
        }).catch(console.error)
      }

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`)
    } else {
      // Payment failed
      await db.subscription.updateMany({
        where: {
          tenantId,
          status: 'pending'
        },
        data: {
          status: 'past_due'
        }
      })

      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription/failed`)
    }
  } catch (error) {
    console.error('Payment callback error:', error)
    return NextResponse.json({ error: 'Callback processing failed' }, { status: 500 })
  }
}

// Handle GET for redirect-based callbacks
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    if (status === 'success') {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription/success`)
    } else {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription/failed`)
    }
  } catch (error) {
    console.error('Payment callback GET error:', error)
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/subscription/failed`)
  }
}
