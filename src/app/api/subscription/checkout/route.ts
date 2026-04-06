import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { createSubscriptionCheckout } from '@/lib/payment/iyzico'

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { planId } = await req.json()

    // Plan kontrolü
    const plan = await db.plan.findUnique({ where: { id: planId } })
    if (!plan) {
      return NextResponse.json({ error: 'Plan bulunamadı' }, { status: 404 })
    }

    // Tenant ve kullanıcı bilgileri
    const tenant = await db.tenant.findUnique({
      where: { id: session.user.tenantId },
      include: {
        businessProfile: true,
        users: {
          where: { role: 'owner' },
          take: 1
        }
      }
    })

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant bulunamadı' }, { status: 404 })
    }

    const owner = tenant.users[0]
    if (!owner) {
      return NextResponse.json({ error: 'İşletme sahibi bulunamadı' }, { status: 404 })
    }

    // Pending subscription oluştur
    const existingSub = await db.subscription.findUnique({
      where: { tenantId: tenant.id }
    })

    if (existingSub) {
      // Mevcut subscription'ı güncelle
      await db.subscription.update({
        where: { id: existingSub.id },
        data: {
          planId,
          status: 'pending'
        }
      })
    } else {
      // Yeni subscription oluştur
      await db.subscription.create({
        data: {
          tenantId: tenant.id,
          planId,
          status: 'pending',
          startDate: new Date()
        }
      })
    }

    // iyzico checkout başlat
    const checkoutResult = await createSubscriptionCheckout({
      planId,
      tenantId: tenant.id,
      customer: {
        name: owner.name || 'İşletme',
        surname: owner.name ? 'Sahibi' : 'Sahibi',
        email: owner.email,
        phoneNumber: tenant.businessProfile?.phone || '+905000000000',
        identityNumber: '11111111111', // Demo için, gerçek uygulamada kullanıcıdan alınmalı
        city: tenant.businessProfile?.city || 'İstanbul',
        country: 'Türkiye',
        address: tenant.businessProfile?.address || 'İstanbul, Türkiye'
      },
      subscriptionInterval: plan.billingPeriod === 'yıllık' ? 'YEARLY' : 'MONTHLY'
    })

    // Checkout result kontrolü
    const result = checkoutResult as { status?: string; checkoutFormContent?: string; paymentPageUrl?: string; errorCode?: string; errorMessage?: string }

    if (result.status === 'failure' || result.errorCode) {
      console.error('iyzico checkout error:', result)
      return NextResponse.json({
        error: 'Ödeme başlatılamadı',
        details: result.errorMessage
      }, { status: 400 })
    }

    // Başarılı yanıt
    return NextResponse.json({
      success: true,
      checkoutFormContent: result.checkoutFormContent,
      paymentPageUrl: result.paymentPageUrl,
      conversationId: `${tenant.id}_${Date.now()}`
    })

  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json({
      error: 'Ödeme başlatılırken hata oluştu',
      details: error.message
    }, { status: 500 })
  }
}
