'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Trophy,
  Target,
  TrendingUp,
  DollarSign,
  Users,
  Calculator,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  Settings,
  Plus,
  Calendar,
  BarChart3,
  Award,
  PieChart,
  Activity,
  UserCircle,
  TrendingDown
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as ReTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface BonusConfig {
  id: string
  isEnabled: boolean
  defaultPeriod: 'WEEKLY' | 'MONTHLY' | 'QUARTERLY'
  calculationDay: number
  baseBonusPercentage: number
  minBookingCount: number
  minCustomerRating: number
}

interface StaffTarget {
  id: string
  staffId: string
  metricType: string
  targetValue: number
  weight: number
}

interface Bonus {
  id: string
  staffId: string
  staffName: string
  period: string
  year: number
  month?: number
  week?: number
  quarter?: number
  calculatedBonus: number
  status: 'PENDING' | 'CALCULATED' | 'APPROVED' | 'PAID' | 'CANCELLED'
  calculatedAt: string | null
  approvedAt: string | null
  paidAt: string | null
  createdAt: string
}

interface PerformanceData {
  name: string
  bonus: number
  bookings: number
  rating: number
}

interface MonthlyTrend {
  month: string
  totalBonus: number
  paidCount: number
  pendingCount: number
}

interface StatusDistribution {
  name: string
  value: number
  color: string
}

const PERIOD_LABELS: Record<string, string> = {
  WEEKLY: 'Haftalık',
  MONTHLY: 'Aylık',
  QUARTERLY: 'Çeyrek Yıllık'
}

const CALCULATION_LABELS: Record<string, string> = {
  FIXED_AMOUNT: 'Sabit Tutar',
  PERCENTAGE: 'Yüzde',
  TIERED: 'Kademeli'
}

const METRIC_LABELS: Record<string, string> = {
  BOOKING_COUNT: 'Randevu Sayısı',
  REVENUE: 'Gelir',
  CUSTOMER_RATING: 'Müşteri Puanı',
  UPSELL_RATE: 'Ek Satış Oranı',
  RETENTION_RATE: 'Müşteri Tutma Oranı',
  ATTENDANCE: 'Mesai Saati'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: 'Bekliyor', color: 'bg-gray-500' },
  CALCULATED: { label: 'Hesaplandı', color: 'bg-blue-500' },
  APPROVED: { label: 'Onaylandı', color: 'bg-yellow-500' },
  PAID: { label: 'Ödendi', color: 'bg-green-500' },
  CANCELLED: { label: 'İptal', color: 'bg-red-500' }
}

export default function StaffBonusesPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [config, setConfig] = useState<BonusConfig | null>(null)
  const [bonuses, setBonuses] = useState<Bonus[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalBonuses: 0,
    totalPaid: 0,
    totalPending: 0
  })

  // Analytics data
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([])
  const [monthlyTrend, setMonthlyTrend] = useState<MonthlyTrend[]>([])
  const [statusDistribution, setStatusDistribution] = useState<StatusDistribution[]>([])
  const [topPerformers, setTopPerformers] = useState<Bonus[]>([])

  // Config form state
  const [isConfigDialogOpen, setIsConfigDialogOpen] = useState(false)
  const [configForm, setConfigForm] = useState({
    isEnabled: true,
    defaultPeriod: 'MONTHLY',
    calculationDay: 1,
    baseBonusPercentage: 5,
    minBookingCount: 50,
    minCustomerRating: 4.0
  })

  // Calculate dialog state
  const [isCalculateDialogOpen, setIsCalculateDialogOpen] = useState(false)
  const [calculateForm, setCalculateForm] = useState({
    period: 'MONTHLY',
    referenceDate: new Date().toISOString().split('T')[0],
    calculateAll: true
  })
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [configRes, bonusesRes, statsRes] = await Promise.all([
        fetch('/api/bonus/config'),
        fetch('/api/bonus/report'),
        fetch('/api/bonus/stats')
      ])

      if (configRes.ok) {
        const configData = await configRes.json()
        setConfig(configData)
        if (configData) {
          setConfigForm({
            isEnabled: configData.isEnabled ?? true,
            defaultPeriod: configData.defaultPeriod || 'MONTHLY',
            calculationDay: configData.calculationDay || 1,
            baseBonusPercentage: configData.baseBonusPercentage || 5,
            minBookingCount: configData.minBookingCount || 50,
            minCustomerRating: configData.minCustomerRating || 4.0
          })
        }
      }

      let bonusesData: Bonus[] = []
      if (bonusesRes.ok) {
        bonusesData = await bonusesRes.json()
        setBonuses(bonusesData)
        // Process analytics data
        processAnalyticsData(bonusesData)
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const processAnalyticsData = (bonusesData: Bonus[]) => {
    if (!bonusesData.length) return

    // Performance by staff
    const staffPerformance = bonusesData.reduce((acc, bonus) => {
      if (!acc[bonus.staffName]) {
        acc[bonus.staffName] = { name: bonus.staffName, bonus: 0, bookings: 0, rating: 0 }
      }
      acc[bonus.staffName].bonus += bonus.calculatedBonus
      acc[bonus.staffName].bookings += 1
      return acc
    }, {} as Record<string, PerformanceData>)
    setPerformanceData(Object.values(staffPerformance).sort((a, b) => b.bonus - a.bonus))

    // Monthly trend (last 6 months)
    const months: MonthlyTrend[] = []
    const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık']
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const monthBonuses = bonusesData.filter(b => {
        const bMonth = `${b.year}-${String(b.month || 1).padStart(2, '0')}`
        return bMonth === monthKey
      })
      months.push({
        month: monthNames[d.getMonth()],
        totalBonus: monthBonuses.reduce((sum, b) => sum + b.calculatedBonus, 0),
        paidCount: monthBonuses.filter(b => b.status === 'PAID').length,
        pendingCount: monthBonuses.filter(b => b.status === 'PENDING' || b.status === 'CALCULATED' || b.status === 'APPROVED').length
      })
    }
    setMonthlyTrend(months)

    // Status distribution
    const statusCounts = bonusesData.reduce((acc, bonus) => {
      acc[bonus.status] = (acc[bonus.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    const statusColors: Record<string, string> = {
      PAID: '#22c55e',
      APPROVED: '#eab308',
      CALCULATED: '#3b82f6',
      PENDING: '#6b7280',
      CANCELLED: '#ef4444'
    }
    setStatusDistribution(Object.entries(statusCounts).map(([status, count]) => ({
      name: STATUS_LABELS[status]?.label || status,
      value: count,
      color: statusColors[status] || '#6b7280'
    })))

    // Top performers
    setTopPerformers(bonusesData.filter(b => b.status === 'PAID').sort((a, b) => b.calculatedBonus - a.calculatedBonus).slice(0, 5))

  const saveConfig = async () => {
    try {
      const response = await fetch('/api/bonus/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(data)
        setIsConfigDialogOpen(false)
      }
    } catch (error) {
      console.error('Error saving config:', error)
    }
  }

  const calculateBonuses = async () => {
    try {
      setCalculating(true)
      const response = await fetch('/api/bonus/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculateForm)
      })

      if (response.ok) {
        await fetchData()
        setIsCalculateDialogOpen(false)
        setActiveTab('bonuses')
      }
    } catch (error) {
      console.error('Error calculating bonuses:', error)
    } finally {
      setCalculating(false)
    }
  }

  const updateBonusStatus = async (bonusId: string, status: string) => {
    try {
      const response = await fetch(`/api/bonus/${bonusId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        await fetchData()
      }
    } catch (error) {
      console.error('Error updating bonus status:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusInfo = STATUS_LABELS[status]
    return (
      <Badge className={statusInfo.color}>
        {statusInfo.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-4 md:grid-cols-4 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performans Prim Sistemi</h1>
          <p className="text-muted-foreground mt-1">
            Personel performans takibi ve prim yönetimi
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsConfigDialogOpen(true)}>
            <Settings className="h-4 w-4 mr-2" />
            Ayarlar
          </Button>
          <Button onClick={() => setIsCalculateDialogOpen(true)}>
            <Calculator className="h-4 w-4 mr-2" />
            Prim Hesapla
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Prim
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBonuses}</div>
            <p className="text-xs text-muted-foreground">Tüm dönemler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ödenen Toplam
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{stats.totalPaid.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Ödenen primler</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bekleyen Ödeme
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₺{stats.totalPending.toLocaleString('tr-TR')}</div>
            <p className="text-xs text-muted-foreground">Onay bekleyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Hesaplama Dönemi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {config ? PERIOD_LABELS[config.defaultPeriod] : 'Ayarlanmadı'}
            </div>
            <p className="text-xs text-muted-foreground">
              %{config?.baseBonusPercentage || 0} prim oranı
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            Özet
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analiz
          </TabsTrigger>
          <TabsTrigger value="bonuses">
            <Trophy className="h-4 w-4 mr-2" />
            Prim Listesi
          </TabsTrigger>
          <TabsTrigger value="targets">
            <Target className="h-4 w-4 mr-2" />
            Hedefler
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          {!config ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Prim sistemi henüz yapılandırılmamış.
                </p>
                <Button onClick={() => setIsConfigDialogOpen(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Ayarları Yapılandır
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Mevcut Ayarlar
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hesaplama Dönemi</span>
                    <span className="font-medium">{PERIOD_LABELS[config.defaultPeriod]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prim Oranı</span>
                    <span className="font-medium">%{config.baseBonusPercentage}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Randevu</span>
                    <span className="font-medium">{config.minBookingCount || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Minimum Puan</span>
                    <span className="font-medium">{config.minCustomerRating || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sistem Durumu</span>
                    <span className="font-medium">{config.isEnabled ? 'Aktif' : 'Pasif'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Son Prim Ödemeleri
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bonuses.filter(b => b.status === 'PAID').length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Henüz ödeme yapılmamış.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {bonuses
                        .filter(b => b.status === 'PAID')
                        .slice(0, 5)
                        .map(bonus => (
                          <div key={bonus.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{bonus.staffName}</p>
                              <p className="text-sm text-muted-foreground">
                                {`${bonus.year}-${bonus.month || bonus.week || bonus.quarter || 1}`}
                              </p>
                            </div>
                            <span className="font-bold text-green-600">
                              ₺{bonus.calculatedBonus.toLocaleString('tr-TR')}
                            </span>
                          </div>
                        ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="bonuses">
          <Card>
            <CardHeader>
              <CardTitle>Tüm Prim Kayıtları</CardTitle>
              <CardDescription>
                Hesaplanan ve ödenen tüm prim kayıtları
              </CardDescription>
            </CardHeader>
            <CardContent>
              {bonuses.length === 0 ? (
                <div className="text-center py-12">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Henüz prim kaydı bulunmuyor.
                  </p>
                  <Button onClick={() => setIsCalculateDialogOpen(true)}>
                    <Calculator className="h-4 w-4 mr-2" />
                    Prim Hesapla
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Personel</TableHead>
                      <TableHead>Dönem</TableHead>
                      <TableHead>Tutar</TableHead>
                      <TableHead>Durum</TableHead>
                      <TableHead>Hesaplama</TableHead>
                      <TableHead className="text-right">İşlemler</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bonuses.map((bonus) => (
                      <TableRow key={bonus.id}>
                        <TableCell className="font-medium">{bonus.staffName}</TableCell>
                        <TableCell>
                          {bonus.year} {bonus.month ? `- ${bonus.month}. ay` : bonus.week ? `- ${bonus.week}. hafta` : bonus.quarter ? `- ${bonus.quarter}. çeyrek` : ''}
                        </TableCell>
                        <TableCell className="font-bold">
                          ₺{bonus.calculatedBonus.toLocaleString('tr-TR')}
                        </TableCell>
                        <TableCell>{getStatusBadge(bonus.status)}</TableCell>
                        <TableCell>
                          {bonus.calculatedAt ? new Date(bonus.calculatedAt).toLocaleDateString('tr-TR') : '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {bonus.status === 'CALCULATED' && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateBonusStatus(bonus.id, 'APPROVED')}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Onayla
                              </Button>
                            )}
                            {bonus.status === 'APPROVED' && (
                              <Button
                                size="sm"
                                onClick={() => updateBonusStatus(bonus.id, 'PAID')}
                              >
                                <DollarSign className="h-4 w-4 mr-1" />
                                Öde
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="space-y-6">
            {/* Monthly Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Aylık Prim Trendi
                </CardTitle>
                <CardDescription>Son 6 ayın prim dağılımı</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <ReTooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalBonus" name="Toplam Prim" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Henüz yeterli veri yok.</p>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Staff Performance Bar Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Personel Performansı
                  </CardTitle>
                  <CardDescription>Toplam prim bazlı sıralama</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={performanceData.slice(0, 5)}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis />
                        <ReTooltip />
                        <Bar dataKey="bonus" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Henüz veri yok.</p>
                  )}
                </CardContent>
              </Card>

              {/* Status Distribution Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5" />
                    Durum Dağılımı
                  </CardTitle>
                  <CardDescription>Prim kayıtlarının durumları</CardDescription>
                </CardHeader>
                <CardContent>
                  {statusDistribution.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <RePieChart>
                        <Pie
                          data={statusDistribution}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={(data: { name?: string; percent?: number }) => `${data.name || ''} ${((data.percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {statusDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <ReTooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">Henüz veri yok.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Performers Table */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  En İyi Performans Gösterenler
                </CardTitle>
                <CardDescription>En yüksek prim alan personeller</CardDescription>
              </CardHeader>
              <CardContent>
                {topPerformers.length > 0 ? (
                  <div className="space-y-3">
                    {topPerformers.map((performer, index) => (
                      <div key={performer.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-gray-200 text-gray-700'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{performer.staffName}</p>
                            <p className="text-sm text-muted-foreground">
                              {performer.year}-{performer.month || performer.week || performer.quarter}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ₺{performer.calculatedBonus.toLocaleString('tr-TR')}
                          </p>
                          <p className="text-sm text-muted-foreground">{STATUS_LABELS[performer.status].label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">Henüz ödeme yapılmamış prim kaydı yok.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="targets">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performans Hedefleri
              </CardTitle>
              <CardDescription>
                Her personel için özel performans hedefleri tanımlayın
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  Hedef yönetimi için personel sayfasına gidin.
                </p>
                <a href="/staff" className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
                  Personel Sayfasına Git
                </a>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Config Dialog */}
      <Dialog open={isConfigDialogOpen} onOpenChange={setIsConfigDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Prim Sistemi Ayarları</DialogTitle>
            <DialogDescription>
              Performans prim sistemi yapılandırmasını güncelleyin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Hesaplama Dönemi</Label>
              <Select
                value={configForm.defaultPeriod}
                onValueChange={(value) => setConfigForm({ ...configForm, defaultPeriod: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Haftalık</SelectItem>
                  <SelectItem value="MONTHLY">Aylık</SelectItem>
                  <SelectItem value="QUARTERLY">Çeyrek Yıllık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Prim Oranı (%)</Label>
              <Input
                type="number"
                step="0.1"
                value={configForm.baseBonusPercentage}
                onChange={(e) => setConfigForm({ ...configForm, baseBonusPercentage: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Randevu Sayısı</Label>
              <Input
                type="number"
                value={configForm.minBookingCount}
                onChange={(e) => setConfigForm({ ...configForm, minBookingCount: parseInt(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Minimum Müşteri Puanı (1-5)</Label>
              <Input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={configForm.minCustomerRating}
                onChange={(e) => setConfigForm({ ...configForm, minCustomerRating: parseFloat(e.target.value) })}
              />
            </div>

            <div className="space-y-2">
              <Label>Hesaplama Günü (Ayın X&apos;i)</Label>
              <Input
                type="number"
                min="1"
                max="31"
                value={configForm.calculationDay}
                onChange={(e) => setConfigForm({ ...configForm, calculationDay: parseInt(e.target.value) })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={configForm.isEnabled}
                onCheckedChange={(checked) => setConfigForm({ ...configForm, isEnabled: checked })}
              />
              <Label>Sistem Aktif</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfigDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={saveConfig}>
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Calculate Dialog */}
      <Dialog open={isCalculateDialogOpen} onOpenChange={setIsCalculateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Prim Hesapla</DialogTitle>
            <DialogDescription>
              Seçili dönem için personel primlerini hesaplayın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Dönem</Label>
              <Select
                value={calculateForm.period}
                onValueChange={(value) => setCalculateForm({ ...calculateForm, period: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEEKLY">Haftalık</SelectItem>
                  <SelectItem value="MONTHLY">Aylık</SelectItem>
                  <SelectItem value="QUARTERLY">Çeyrek Yıllık</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Referans Tarihi</Label>
              <Input
                type="date"
                value={calculateForm.referenceDate}
                onChange={(e) => setCalculateForm({ ...calculateForm, referenceDate: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={calculateForm.calculateAll}
                onCheckedChange={(checked) => setCalculateForm({ ...calculateForm, calculateAll: checked })}
              />
              <Label>Tüm personel için hesapla</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCalculateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={calculateBonuses} disabled={calculating}>
              {calculating ? 'Hesaplanıyor...' : 'Hesapla'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}}
