import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createSubscriptionCheckout, isPaymentSuccess } from '@/lib/payment/iyzico'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { planId, customerInfo } = body

    if (!planId || !customerInfo) {
      return NextResponse.json(
        { error: 'Plan ID and customer info required' },
        { status: 400 }
      )
    }

    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 })
    }

    // Create iyzico checkout form
    const result = await createSubscriptionCheckout({
      planId,
      tenantId: tenant.id,
      customer: {
        name: customerInfo.name,
        surname: customerInfo.surname,
        email: customerInfo.email,
        phoneNumber: customerInfo.phone,
        identityNumber: customerInfo.identityNumber,
        city: customerInfo.city,
        country: customerInfo.country || 'Türkiye',
        address: customerInfo.address
      }
    }) as any

    if (!isPaymentSuccess(result)) {
      return NextResponse.json(
        { error: 'Payment initialization failed', details: result },
        { status: 400 }
      )
    }

    // Create pending subscription record
    await db.subscription.create({
      data: {
        tenantId: tenant.id,
        planId,
        status: 'pending',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      }
    })

    return NextResponse.json({
      success: true,
      checkoutFormContent: result.checkoutFormContent,
      token: result.token,
      paymentPageUrl: result.paymentPageUrl
    })
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create payment', message: error.message },
      { status: 500 }
    )
  }
}

// Get payment status
export async function GET(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const subscription = await db.subscription.findFirst({
      where: { tenantId: session.user.tenantId },
      orderBy: { startDate: 'desc' }
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    return NextResponse.json({
      status: subscription.status,
      startDate: subscription.startDate,
      endDate: subscription.endDate
    })
  } catch (error) {
    console.error('Payment status error:', error)
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}
