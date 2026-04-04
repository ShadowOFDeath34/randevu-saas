'use client'

import { useState, useEffect } from 'react'
import { CreditCard, Check } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  planName: string
  price: number
  billingPeriod: string
  currentPeriodEnd: string
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  currency: string
  status: string
  dueDate: string
  paidAt: string | null
}

const PLANS = [
  { id: 'basic', name: 'Başlangıç', price: 0, features: ['100 randevu/ay', '1 personel', 'Temel raporlar'] },
  { id: 'pro', name: 'Profesyonel', price: 299, features: ['Sınırsız randevu', '10 personel', 'AI Analytics', 'SMS Bildirimler'] },
  { id: 'enterprise', name: 'Kurumsal', price: 799, features: ['Her şey sınırsız', 'Sınırsız personel', 'Özel entegrasyonlar', '7/24 Destek'] }
]

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upgrading, setUpgrading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/subscription')
      if (!response.ok) {
        throw new Error('Veri yüklenemedi')
      }
      const data = await response.json()
      setSubscription(data.subscription)
      setInvoices(data.invoices || [])
      setError(null)
    } catch (err) {
      setError('Abonelik bilgileri yüklenirken hata oluştu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (response.ok) {
        setMessage('Plan yükseltme isteği alındı')
        fetchBillingData()
      } else {
        throw new Error('Upgrade failed')
      }
    } catch (err) {
      setMessage('Şu anda manuel yükseltme desteklenmiyor. Lütfen destek ile iletişime geçin.')
      console.error(err)
    } finally {
      setUpgrading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-100 text-green-700',
      trialing: 'bg-blue-100 text-blue-700',
      past_due: 'bg-red-100 text-red-700',
      canceled: 'bg-gray-100 text-gray-700'
    }
    const labels: Record<string, string> = {
      active: 'Aktif',
      trialing: 'Deneme',
      past_due: 'Ödeme Bekliyor',
      canceled: 'İptal Edildi'
    }
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || 'bg-gray-100 text-gray-700'}`}>
        {labels[status] || status}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Abonelik & Fatura</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-6">Abonelik & Fatura</h1>
        <div className="bg-red-50 border border-red-200 rounded-xl p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button
            onClick={fetchBillingData}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abonelik & Fatura</h1>
        <p className="text-gray-500 mt-1">Abonelik durumunuzu ve fatura geçmişinizi görüntüleyin</p>
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.includes('hata') || message.includes('desteklenmiyor') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          {message}
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Mevcut Abonelik
        </h2>

        {subscription ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{subscription.planName}</p>
                <p className="text-gray-500">
                  {subscription.price > 0 ? `${subscription.price}₺/${subscription.billingPeriod}` : 'Ücretsiz'}
                </p>
              </div>
              {getStatusBadge(subscription.status)}
            </div>
            {subscription.currentPeriodEnd && (
              <p className="text-sm text-gray-500">
                Bir sonraki yenileme: {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aktif aboneliğiniz bulunmuyor</p>
            <button
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              onClick={() => handleUpgrade('pro')}
            >
              Plan Seç
            </button>
          </div>
        )}
      </div>

      {/* Available Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`bg-white rounded-xl border p-6 ${subscription?.planName === plan.name ? 'border-indigo-500 ring-2 ring-indigo-500/20' : 'border-gray-200'}`}
          >
            <h3 className="text-lg font-semibold">{plan.name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold">{plan.price}₺</span>
              <span className="text-gray-500">/ay</span>
            </div>

            <ul className="space-y-2 mb-6">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                  <Check className="h-4 w-4 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>

            <button
              className={`w-full py-2 rounded-lg font-medium ${
                subscription?.planName === plan.name
                  ? 'bg-gray-100 text-gray-700 cursor-default'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
              disabled={subscription?.planName === plan.name || upgrading}
              onClick={() => handleUpgrade(plan.id)}
            >
              {subscription?.planName === plan.name ? 'Mevcut Plan' : 'Yükselt'}
            </button>
          </div>
        ))}
      </div>

      {/* Invoice History */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold mb-4">Fatura Geçmişi</h2>

        {invoices.length > 0 ? (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{invoice.amount}{invoice.currency}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    invoice.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {invoice.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>Henüz fatura bulunmuyor</p>
          </div>
        )}
      </div>
    </div>
  )
}
