import type Iyzipay from 'iyzipay'

// Iyzipay client'ini lazy load et - Turbopack uyumluluğu için
let iyziClient: InstanceType<typeof Iyzipay> | null = null

async function getIyziClient(): Promise<InstanceType<typeof Iyzipay>> {
  if (!iyziClient) {
    const { default: IyzipayModule } = await import('iyzipay')
    iyziClient = new IyzipayModule({
      apiKey: process.env.IYZIPAY_API_KEY || '',
      secretKey: process.env.IYZIPAY_SECRET_KEY || '',
      baseUrl: process.env.IYZIPAY_BASE_URL || 'https://sandbox-api.iyzico.com'
    })
  }
  return iyziClient
}

export interface CreatePaymentParams {
  price: number
  paidPrice?: number
  currency: 'TRY' | 'USD' | 'EUR'
  basketId: string
  paymentChannel: 'WEB' | 'MOBILE_WEB' | 'MOBILE_APP' | 'POS'
  paymentGroup: 'PRODUCT' | 'LISTING' | 'SUBSCRIPTION'
  buyer: {
    id: string
    name: string
    surname: string
    email: string
    phoneNumber: string
    identityNumber?: string
    registrationAddress: string
    city: string
    country: string
    zipCode?: string
  }
  shippingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
    zipCode?: string
  }
  basketItems: {
    id: string
    name: string
    category1: string
    category2?: string
    itemType: 'PHYSICAL' | 'VIRTUAL'
    price: number
  }[]
}

export interface CreateSubscriptionParams {
  planId: string
  tenantId: string
  customer: {
    name: string
    surname: string
    email: string
    phoneNumber: string
    identityNumber?: string
    city: string
    country: string
    address: string
  }
  subscriptionInitialPeriod?: number
  subscriptionInterval?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
}

export async function createPayment(params: CreatePaymentParams) {
  const client = await getIyziClient()
  return new Promise((resolve, reject) => {
    client.payment.create(params, (err: Error | null, result: unknown) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

/**
 * TC Kimlik No validasyonu
 * 11 haneli ve tum rakamlardan olusmalidir
 */
function validateIdentityNumber(identityNumber: string | undefined): string {
  if (!identityNumber) {
    throw new Error('TC Kimlik Numarasi gereklidir')
  }

  // Sadece rakamlardan olusmalidir
  const clean = identityNumber.replace(/\D/g, '')

  if (clean.length !== 11) {
    throw new Error('TC Kimlik Numarasi 11 haneli olmalidir')
  }

  return clean
}

/**
 * Plan fiyatini getir (DB'den veya config'den)
 * NOT: Bu fonksiyon gercek implementasyonda DB'den plan fiyatini cekmeli
 */
async function getPlanPrice(planId: string): Promise<{ price: number; currency: string }> {
  // Gecici: Plan ID'ye gore fiyat dondur
  // Gercek implementasyonda DB sorgusu yapilmali
  const planPrices: Record<string, { price: number; currency: string }> = {
    'basic': { price: 199, currency: 'TRY' },
    'pro': { price: 399, currency: 'TRY' },
    'enterprise': { price: 799, currency: 'TRY' }
  }

  const plan = planPrices[planId]
  if (!plan) {
    throw new Error(`Gecersiz plan ID: ${planId}`)
  }

  return plan
}

export async function createSubscriptionCheckout(params: CreateSubscriptionParams) {
  const { planId, tenantId, customer, subscriptionInterval = 'MONTHLY' } = params

  // Validasyonlar
  if (!customer.name || !customer.surname) {
    throw new Error('Musteri adi ve soyadi gereklidir')
  }

  if (!customer.email) {
    throw new Error('Email adresi gereklidir')
  }

  if (!customer.phoneNumber) {
    throw new Error('Telefon numarasi gereklidir')
  }

  if (!customer.address || !customer.city) {
    throw new Error('Adres ve sehir bilgisi gereklidir')
  }

  // TC Kimlik No validasyonu
  const identityNumber = validateIdentityNumber(customer.identityNumber)

  // Plan fiyatini al
  const planDetails = await getPlanPrice(planId)
  const price = planDetails.price.toFixed(2)

  // Zip code - musteri adresinden veya varsayilan
  const zipCode = '34000' // TODO: Adres parse edilerek zip code cikarilmali

  const checkoutFormInit = {
    locale: 'tr',
    conversationId: `${tenantId}_${Date.now()}`,
    price: price,
    paidPrice: price,
    currency: planDetails.currency,
    basketId: `basket_${tenantId}_${Date.now()}`,
    paymentChannel: 'WEB',
    paymentGroup: 'SUBSCRIPTION',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/subscription/callback`,
    buyer: {
      id: tenantId,
      name: customer.name,
      surname: customer.surname,
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      identityNumber: identityNumber,
      registrationAddress: customer.address,
      city: customer.city,
      country: 'Türkiye',
      zipCode: zipCode
    },
    shippingAddress: {
      contactName: `${customer.name} ${customer.surname}`,
      city: customer.city,
      country: 'Türkiye',
      address: customer.address,
      zipCode: zipCode
    },
    billingAddress: {
      contactName: `${customer.name} ${customer.surname}`,
      city: customer.city,
      country: 'Türkiye',
      address: customer.address,
      zipCode: zipCode
    },
    basketItems: [
      {
        id: planId,
        name: 'RandevuAI Abonelik',
        category1: 'Yazilim',
        itemType: 'VIRTUAL' as const,
        price: price
      }
    ],
    subscriptionInitialPeriod: 1,
    subscriptionInterval
  }

  const client = await getIyziClient()
  return new Promise((resolve, reject) => {
    client.checkoutFormAuthInitialize.create(checkoutFormInit, (err: Error | null, result: unknown) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export async function cancelSubscription(subscriptionId: string) {
  const cancel = {
    locale: 'tr',
    conversationId: `cancel_${Date.now()}`,
    subscriptionId
  }

  const client = await getIyziClient()
  return new Promise((resolve, reject) => {
    client.subscription.cancel(cancel, (err: Error | null, result: unknown) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export async function getSubscription(subscriptionId: string) {
  const retrieve = {
    locale: 'tr',
    conversationId: `retrieve_${Date.now()}`,
    subscriptionId
  }

  const client = await getIyziClient()
  return new Promise((resolve, reject) => {
    client.subscription.retrieve(retrieve, (err: Error | null, result: unknown) => {
      if (err) {
        reject(err)
      } else {
        resolve(result)
      }
    })
  })
}

export function isPaymentSuccess(result: { status?: string; paymentStatus?: string }): boolean {
  return result.status === 'success' || result.paymentStatus === 'SUCCESS'
}
