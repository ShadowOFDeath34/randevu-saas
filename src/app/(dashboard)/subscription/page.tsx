'use client'

import { useState, useEffect } from 'react'
import { Check, CreditCard, Calendar, Crown, Zap, Building2, X } from 'lucide-react'
import { useSubscription, usePlans, useCheckoutPlan } from '@/hooks/use-subscription'
import { Skeleton } from '@/components/ui/skeleton'

interface Plan {
  id: string
  name: string
  price: number
  billingPeriod: string
  features: string[]
}

interface Invoice {
  id: string
  invoiceNumber: string
  amount: number
  status: string
  dueDate: string
  paidAt?: string
  description?: string
}

export default function SubscriptionPage() {
  const { data: subscriptionData, isLoading: subLoading } = useSubscription()
  const { data: plans = [], isLoading: plansLoading } = usePlans()
  const checkoutPlan = useCheckoutPlan()

  const [showUpgrade, setShowUpgrade] = useState(false)

  const subscription = subscriptionData?.subscription
  const invoices = subscriptionData?.invoices || []

  const currentPlan = subscription?.plan
  const isTrial = subscription?.status === 'trial'

  const handleCheckout = async (planId: string) => {
    try {
      const result = await checkoutPlan.mutateAsync(planId)

      if (result.success && result.paymentPageUrl) {
        // iyzico odeme sayfasina yonlendir
        window.location.href = result.paymentPageUrl
      } else {
        console.error('Checkout failed:', result)
        alert('Odeme baslatilirken bir hata olustu. Lutfen tekrar deneyin.')
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Odeme baslatilirken bir hata olustu. Lutfen tekrar deneyin.')
    }
  }

  if (subLoading || plansLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        <Skeleton className="h-40 w-full rounded-xl" />

        <div className="grid md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Abonelik</h1>
        <button
          onClick={() => setShowUpgrade(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2"
        >
          <Zap className="w-4 h-4" />
          Plan Değiştir
        </button>
      </div>

      {/* Mevcut Plan */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5" />
              <span className="text-indigo-100">Mevcut Plan</span>
            </div>
            <h2 className="text-3xl font-bold">{currentPlan?.name}</h2>
            <p className="text-indigo-100 mt-1">
              {currentPlan?.price} TL / {currentPlan?.billingPeriod}
            </p>
          </div>
          <div className={`px-4 py-2 rounded-full text-sm font-medium ${
            isTrial ? 'bg-yellow-500/20 text-yellow-100' : 'bg-green-500/20 text-green-100'
          }`}>
            {isTrial ? 'Deneme' : 'Aktif'}
          </div>
        </div>

        {isTrial && subscription?.trialEndsAt && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-indigo-100">
              Deneme süresi bitiyor: {new Date(subscription.trialEndsAt).toLocaleDateString('tr-TR')}
            </p>
          </div>
        )}

        {!isTrial && subscription?.endDate && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <p className="text-sm text-indigo-100">
              Abonelik yenileme: {new Date(subscription.endDate).toLocaleDateString('tr-TR')}
            </p>
          </div>
        )}
      </div>

      {/* Kullanım İstatistikleri */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="text-sm text-gray-500">Bu Ay</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {invoices.length} <span className="text-sm font-normal text-gray-500">fatura</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <span className="text-sm text-gray-500">Ödenen</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {invoices.filter((i: Invoice) => i.status === 'paid').reduce((sum: number, i: Invoice) => sum + i.amount, 0)} <span className="text-sm font-normal text-gray-500">TL</span>
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            <span className="text-sm text-gray-500">Durum</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {subscription?.status === 'active' ? 'Aktif' : subscription?.status === 'trial' ? 'Deneme' : 'Pasif'}
          </p>
        </div>
      </div>

      {/* Faturalar */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Faturalar</h3>
        </div>

        {invoices.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            Henüz fatura yok
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {invoices.map((invoice: Invoice) => (
              <div key={invoice.id} className="px-6 py-4 flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{invoice.amount} TL</p>
                  <span className={`text-sm ${
                    invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {invoice.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Plan Değiştir Modal */}
      {showUpgrade && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">Plan Seçin</h2>
              <button onClick={() => setShowUpgrade(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 grid md:grid-cols-3 gap-4">
              {plans.map((plan: Plan) => (
                <div
                  key={plan.id}
                  className={`border-2 rounded-xl p-6 ${
                    plan.name === currentPlan?.name
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-indigo-300'
                  }`}
                >
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <p className="text-3xl font-bold text-indigo-600 mb-4">
                    {plan.price} TL <span className="text-sm font-normal text-gray-500">/ {plan.billingPeriod}</span>
                  </p>

                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => plan.name !== currentPlan?.name && handleCheckout(plan.id)}
                    disabled={plan.name === currentPlan?.name || checkoutPlan.isPending}
                    className={`w-full py-2 rounded-lg font-medium ${
                      plan.name === currentPlan?.name
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700'
                    }`}
                  >
                    {plan.name === currentPlan?.name ? 'Mevcut Plan' : checkoutPlan.isPending ? 'Yonlendiriliyor...' : 'Sec'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
