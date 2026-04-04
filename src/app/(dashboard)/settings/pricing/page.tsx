'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Clock,
  Users,
  Zap,
  Plus,
  Trash2,
  Edit2,
  AlertCircle,
  Loader2,
  Check,
  BarChart3
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface PricingConfig {
  id: string
  isEnabled: boolean
  minAdjustmentPercent: number
  maxAdjustmentPercent: number
  useAiOptimization: boolean
  autoSurgePricing: boolean
  autoOffPeakDiscount: boolean
  peakHoursStart: string
  peakHoursEnd: string
  highDemandThreshold: number
  lowDemandThreshold: number
}

interface PricingRule {
  id: string
  name: string
  description: string
  ruleType: string
  adjustmentType: string
  adjustmentValue: number
  isActive: boolean
  priority: number
  startTime?: string
  endTime?: string
}

interface AnalyticsData {
  summary: {
    totalAdjustments: number
    avgAdjustmentPercent: number
    increaseCount: number
    decreaseCount: number
    noChangeCount: number
  }
  recentHistory: Array<{
    id: string
    basePrice: number
    adjustedPrice: number
    adjustmentPercent: number
    bookingDate: string
    startTime: string
    occupancyRate: number | null
  }>
}

const RULE_TYPE_LABELS: Record<string, string> = {
  SURGE_PEAK_HOURS: 'Yoğun Saat Artışı',
  DISCOUNT_OFF_PEAK: 'Boş Saat İndirimi',
  LAST_MINUTE: 'Son Dakika İndirimi',
  ADVANCE_BOOKING: 'Erken Rezervasyon',
  LOYALTY_BONUS: 'Sadakat İndirimi',
  STANDOUT: 'Popüler Personel'
}

export default function PricingPage() {
  const [config, setConfig] = useState<PricingConfig | null>(null)
  const [rules, setRules] = useState<PricingRule[]>([])
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'rules' | 'analytics'>('overview')

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [configRes, rulesRes, analyticsRes] = await Promise.all([
        fetch('/api/pricing/config'),
        fetch('/api/pricing/rules'),
        fetch('/api/pricing/analytics?days=30')
      ])

      if (!configRes.ok || !rulesRes.ok) throw new Error('Veri yüklenemedi')

      const configData = await configRes.json()
      const rulesData = await rulesRes.json()
      setConfig(configData)
      setRules(rulesData)

      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json()
        setAnalytics(analyticsData)
      }

      setError(null)
    } catch (err) {
      setError('Veriler yüklenirken hata oluştu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggleEnabled = async () => {
    if (!config) return

    setSaving(true)
    try {
      const response = await fetch('/api/pricing/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...config, isEnabled: !config.isEnabled })
      })

      if (response.ok) {
        const updated = await response.json()
        setConfig(updated)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const getAdjustmentBadge = (type: string, value: number) => {
    if (type.includes('INCREASE')) {
      return <Badge className="bg-red-500">+{value}%</Badge>
    }
    if (type.includes('DECREASE')) {
      return <Badge className="bg-green-500">-{value}%</Badge>
    }
    return <Badge>{value}</Badge>
  }

  if (loading) {
    return (
      <div className="p-6 max-w-6xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-6 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (error || !config) {
    return (
      <div className="p-6 max-w-6xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Dinamik Fiyatlandırma</h1>
        <p className="text-muted-foreground mb-6">AI destekli fiyat optimizasyonu</p>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error || 'Yüklenemedi'}</p>
            <Button onClick={fetchData}>Tekrar Dene</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dinamik Fiyatlandırma</h1>
            <p className="text-muted-foreground mt-1">AI destekli fiyat optimizasyonu</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch
                checked={config.isEnabled}
                onCheckedChange={handleToggleEnabled}
                disabled={saving}
              />
              <Label>{config.isEnabled ? 'Aktif' : 'Pasif'}</Label>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={activeTab === 'overview' ? 'default' : 'outline'}
          onClick={() => setActiveTab('overview')}
        >
          <Zap className="h-4 w-4 mr-2" />
          Genel Bakış
        </Button>
        <Button
          variant={activeTab === 'rules' ? 'default' : 'outline'}
          onClick={() => setActiveTab('rules')}
        >
          <Clock className="h-4 w-4 mr-2" />
          Kurallar ({rules.length})
        </Button>
        <Button
          variant={activeTab === 'analytics' ? 'default' : 'outline'}
          onClick={() => setActiveTab('analytics')}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          Analitik
        </Button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Aktif Kurallar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {rules.filter(r => r.isActive).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Ort. Fiyat Değişimi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.summary.avgAdjustmentPercent?.toFixed(1) || 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Toplam Ayarlama
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {analytics?.summary.totalAdjustments || 0}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  AI Optimizasyonu
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {config.useAiOptimization ? (
                    <span className="text-green-500 flex items-center gap-1">
                      <Check className="h-5 w-5" /> Aktif
                    </span>
                  ) : (
                    <span className="text-gray-500">Pasif</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Fiyat Aralık Ayarları</CardTitle>
              <CardDescription>Min/max fiyat değişim limitleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Maksimum İndirim (%)</Label>
                  <Input
                    type="number"
                    value={Math.abs(config.minAdjustmentPercent)}
                    onChange={(e) => setConfig({ ...config, minAdjustmentPercent: -parseInt(e.target.value) })}
                    disabled={!config.isEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maksimum Zam (%)</Label>
                  <Input
                    type="number"
                    value={config.maxAdjustmentPercent}
                    onChange={(e) => setConfig({ ...config, maxAdjustmentPercent: parseInt(e.target.value) })}
                    disabled={!config.isEnabled}
                  />
                </div>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Yoğun Saat Başlangıç</Label>
                  <Input
                    type="time"
                    value={config.peakHoursStart}
                    onChange={(e) => setConfig({ ...config, peakHoursStart: e.target.value })}
                    disabled={!config.isEnabled}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yoğun Saat Bitiş</Label>
                  <Input
                    type="time"
                    value={config.peakHoursEnd}
                    onChange={(e) => setConfig({ ...config, peakHoursEnd: e.target.value })}
                    disabled={!config.isEnabled}
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.autoSurgePricing}
                    onCheckedChange={(v) => setConfig({ ...config, autoSurgePricing: v })}
                    disabled={!config.isEnabled}
                  />
                  <Label>Otomatik Yoğunluk Zammı</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.autoOffPeakDiscount}
                    onCheckedChange={(v) => setConfig({ ...config, autoOffPeakDiscount: v })}
                    disabled={!config.isEnabled}
                  />
                  <Label>Otomatik Boş Saat İndirimi</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Rules Tab */}
      {activeTab === 'rules' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Fiyatlandırma Kuralları</h3>
            <Button disabled={!config.isEnabled}>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Kural
            </Button>
          </div>

          {rules.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <DollarSign className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Henüz kural bulunmuyor</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Dinamik fiyatlandırmayı etkinleştirdiğinizde varsayılan kurallar oluşturulacak
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} className={!rule.isActive ? 'opacity-60' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div>
                          <p className="font-medium">{rule.name}</p>
                          <p className="text-sm text-muted-foreground">{rule.description}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline">{RULE_TYPE_LABELS[rule.ruleType] || rule.ruleType}</Badge>
                            {rule.startTime && rule.endTime && (
                              <span className="text-xs text-muted-foreground">
                                {rule.startTime} - {rule.endTime}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {getAdjustmentBadge(rule.adjustmentType, rule.adjustmentValue)}
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm">
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Analytics Tab */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fiyat Ayarlama Dağılımı</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {analytics?.summary.decreaseCount || 0}
                  </p>
                  <p className="text-sm text-green-600">İndirim</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-600">
                    {analytics?.summary.noChangeCount || 0}
                  </p>
                  <p className="text-sm text-gray-600">Değişiklik Yok</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-2xl font-bold text-red-600">
                    {analytics?.summary.increaseCount || 0}
                  </p>
                  <p className="text-sm text-red-600">Zam</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Son Fiyat Ayarlamaları</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics?.recentHistory && analytics.recentHistory.length > 0 ? (
                <div className="space-y-2">
                  {analytics.recentHistory.slice(0, 10).map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{item.bookingDate} {item.startTime}</p>
                        <p className="text-sm text-muted-foreground">
                          Doluluk: {item.occupancyRate || 0}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.basePrice}₺ → {item.adjustedPrice}₺</p>
                        <p className={`text-sm ${item.adjustmentPercent > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          {item.adjustmentPercent > 0 ? '+' : ''}{item.adjustmentPercent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Henüz fiyat ayarlaması yapılmadı
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
