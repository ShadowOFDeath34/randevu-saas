'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { CreditCard, Receipt, Zap, Check, AlertCircle } from 'lucide-react'

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
  const [upgrading, setUpgrading] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchBillingData()
  }, [])

  const fetchBillingData = async () => {
    try {
      const response = await fetch('/api/subscription')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data.subscription)
        setInvoices(data.invoices || [])
      }
    } catch (error) {
      console.error('Error fetching billing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpgrade = async (planId: string) => {
    setUpgrading(true)
    try {
      const response = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId })
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'Plan yükseltme isteği alındı'
        })
        fetchBillingData()
      } else {
        throw new Error('Upgrade failed')
      }
    } catch (error) {
      toast({
        title: 'Bilgi',
        description: 'Şu anda manuel yükseltme desteklenmiyor. Lütfen destek ile iletişime geçin.',
        variant: 'destructive'
      })
    } finally {
      setUpgrading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Aktif</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500">Deneme</Badge>
      case 'past_due':
        return <Badge variant="destructive">Ödeme Bekliyor</Badge>
      case 'canceled':
        return <Badge variant="secondary">İptal Edildi</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-32" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Abonelik & Fatura</h1>
        <p className="text-muted-foreground">
          Abonelik durumunuzu ve fatura geçmişinizi görüntüleyin
        </p>
      </div>

      {/* Current Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Mevcut Abonelik
          </CardTitle>
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
              <Button className="mt-4" onClick={() => handleUpgrade('pro')}>
                Plan Seç
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Available Plans */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLANS.map((plan) => (
          <Card key={plan.id} className={subscription?.planName === plan.name ? 'border-primary' : ''}>
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
                  <li key={i} className="flex items-center gap-2 text-sm">
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
                {subscription?.planName === plan.name ? 'Mevcut Plan' : 'Yükselt'}
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
              Henüz fatura bulunmuyor
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
