'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { CreditCard, Check, Receipt, AlertCircle, Loader2, Zap } from 'lucide-react'

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
      if (!response.ok) throw new Error('Veri yüklenemedi')
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
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      active: 'default',
      trialing: 'secondary',
      past_due: 'destructive',
      canceled: 'outline'
    }
    const labels: Record<string, string> = {
      active: 'Aktif',
      trialing: 'Deneme',
      past_due: 'Ödeme Bekliyor',
      canceled: 'İptal Edildi'
    }
    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Abonelik & Fatura</h1>
        <p className="text-muted-foreground mb-6">Abonelik durumunuzu ve fatura geçmişinizi görüntüleyin</p>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchBillingData}>Tekrar Dene</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Abonelik & Fatura</h1>
        <p className="text-muted-foreground mt-1">Abonelik durumunuzu ve fatura geçmişinizi görüntüleyin</p>
      </div>

      {message && (
        <div className={`mb-4 p-4 rounded-lg ${message.includes('hata') || message.includes('desteklenmiyor') ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-green-50 text-green-600 border border-green-200'}`}>
          {message}
        </div>
      )}

      <div className="space-y-6">
        {/* Current Subscription */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Mevcut Abonelik
            </CardTitle>
            <CardDescription>Geçerli abonelik planınız</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold">{subscription.planName}</p>
                    <p className="text-muted-foreground">
                      {subscription.price > 0 ? `${subscription.price}₺/${subscription.billingPeriod}` : 'Ücretsiz'}
                    </p>
                  </div>
                  {getStatusBadge(subscription.status)}
                </div>
                {subscription.currentPeriodEnd && (
                  <p className="text-sm text-muted-foreground">
                    Bir sonraki yenileme: {new Date(subscription.currentPeriodEnd).toLocaleDateString('tr-TR')}
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aktif aboneliğiniz bulunmuyor</p>
                <Button className="mt-4" onClick={() => handleUpgrade('pro')}>Plan Seç</Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Available Plans */}
        <div className="grid gap-4 md:grid-cols-3">
          {PLANS.map((plan) => (
            <Card key={plan.id} className={subscription?.planName === plan.name ? 'border-primary ring-2 ring-primary/20' : ''}>
              <CardHeader>
                <CardTitle className="text-lg">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-2xl font-bold text-foreground">{plan.price}₺</span>
                  <span className="text-muted-foreground">/ay</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={subscription?.planName === plan.name ? 'secondary' : 'default'}
                  disabled={subscription?.planName === plan.name || upgrading}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {upgrading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    subscription?.planName === plan.name ? 'Mevcut Plan' : 'Yükselt'
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Fatura Geçmişi
            </CardTitle>
            <CardDescription>Geçmiş ödemeleriniz</CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{invoice.invoiceNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(invoice.dueDate).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{invoice.amount}{invoice.currency}</p>
                      <Badge variant={invoice.status === 'paid' ? 'default' : 'destructive'}>
                        {invoice.status === 'paid' ? 'Ödendi' : 'Bekliyor'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Henüz fatura bulunmuyor</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
