export interface Plan {
  id: string
  name: string
  price: number
  billingPeriod: 'monthly' | 'yearly'
  maxStaff: number
  maxBookingsPerMonth: number
  maxCustomers: number
  features: PlanFeature[]
  isPopular?: boolean
}

export interface PlanFeature {
  name: string
  included: boolean
  description?: string
}

export const plans: Plan[] = [
  {
    id: 'baslangic',
    name: 'Başlangıç',
    price: 199,
    billingPeriod: 'monthly',
    maxStaff: 1,
    maxBookingsPerMonth: 100,
    maxCustomers: 500,
    features: [
      { name: '1 Personel', included: true },
      { name: 'Sınırsız Randevu', included: true },
      { name: 'Online Randevu Sayfası', included: true },
      { name: 'Temel İstatistikler', included: true },
      { name: 'E-posta Bildirimleri', included: true },
      { name: 'Otomatik Hatırlatma', included: false },
      { name: 'Yorum İsteme', included: false },
      { name: 'SMS Bildirimleri', included: false },
      { name: 'Çoklu Şube', included: false },
      { name: 'AI Asistan', included: false }
    ]
  },
  {
    id: 'standart',
    name: 'Standart',
    price: 399,
    billingPeriod: 'monthly',
    maxStaff: 5,
    maxBookingsPerMonth: 500,
    maxCustomers: 2000,
    isPopular: true,
    features: [
      { name: '5 Personel', included: true },
      { name: 'Sınırsız Randevu', included: true },
      { name: 'Online Randevu Sayfası', included: true },
      { name: 'Gelişmiş İstatistikler', included: true },
      { name: 'E-posta Bildirimleri', included: true },
      { name: 'Otomatik Hatırlatma', included: true },
      { name: 'Yorum İsteme', included: true },
      { name: 'SMS Bildirimleri', included: true },
      { name: 'Çoklu Şube', included: false },
      { name: 'AI Asistan', included: false }
    ]
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 799,
    billingPeriod: 'monthly',
    maxStaff: 999,
    maxBookingsPerMonth: 999999,
    maxCustomers: 999999,
    features: [
      { name: 'Sınırsız Personel', included: true },
      { name: 'Sınırsız Randevu', included: true },
      { name: 'Online Randevu Sayfası', included: true },
      { name: 'Gelişmiş İstatistikler', included: true },
      { name: 'E-posta Bildirimleri', included: true },
      { name: 'Otomatik Hatırlatma', included: true },
      { name: 'Yorum İsteme', included: true },
      { name: 'SMS Bildirimleri', included: true },
      { name: 'Çoklu Şube', included: true },
      { name: 'AI Asistan', included: true }
    ]
  }
]

export function getPlanById(id: string): Plan | undefined {
  return plans.find(p => p.id === id)
}

export function getYearlyPrice(monthlyPrice: number): number {
  return Math.round(monthlyPrice * 10)
}
