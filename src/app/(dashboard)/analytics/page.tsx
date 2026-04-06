'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  BrainCircuit,
  AlertCircle,
  Crown,
  UserPlus,
  UserMinus
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface AnalyticsData {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  noShowBookings: number
  totalRevenue: number
  totalCustomers: number
  repeatCustomers: number
  popularServices: { name: string; count: number }[]
  topStaff: { name: string; count: number }[]
  dailyBookings: { date: string; count: number }[]
  weeklyStats: { day: string; bookings: number; revenue: number }[]
  ai: {
    customerBehavior: {
      peakHours: { hour: number; bookings: number }[]
      peakDays: { day: string; bookings: number }[]
      avgBookingLeadTime: number
      customerRetention: {
        newCustomers: number
        returningCustomers: number
        retentionRate: number
      }
    }
    predictions: {
      nextWeek: {
        expectedBookings: number
        confidence: number
        trend: 'up' | 'down' | 'stable'
      }
      revenue: {
        expectedRevenue: number
        confidence: number
        trend: 'up' | 'down' | 'stable'
      }
      recommendations: string[]
    }
    customerSegments: {
      vip: { count: number; avgSpend: number }
      regular: { count: number; avgSpend: number }
      atRisk: { count: number; lastBooking: string }
      new: { count: number; conversionRate: number }
    }
  }
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch(`/api/analytics?period=${period}`)
        if (!response.ok) throw new Error('Failed to fetch')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalytics()
  }, [period])

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/analytics?period=${period}`)
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { ai } = data

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Analytics</h1>
            <p className="text-muted-foreground">
              Yapay zeka destekli detaylı analiz ve tahminler
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {['week', 'month', 'year'].map((p) => (
            <button
              key={p}
              onClick={() => {
                setPeriod(p)
                setLoading(true)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80'
              }`}
            >
              {p === 'week' && 'Son 7 Gün'}
              {p === 'month' && 'Son 30 Gün'}
              {p === 'year' && 'Son 1 Yıl'}
            </button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="ai-predictions">AI Tahminler</TabsTrigger>
          <TabsTrigger value="customers">Müşteri Analizi</TabsTrigger>
          <TabsTrigger value="trends">Trendler</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Toplam Randevu</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{data.totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  {data.completedBookings} tamamlandı
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gelir</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {data.totalRevenue.toLocaleString('tr-TR')} ₺
                </div>
                <p className="text-xs text-muted-foreground">
                  Tamamlanan randevulardan
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Müşteri Tutma</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ai.customerBehavior.customerRetention.retentionRate}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {ai.customerBehavior.customerRetention.returningCustomers} tekrar eden
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VIP Müşteri</CardTitle>
                <Crown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {ai.customerSegments.vip.count}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ort. {ai.customerSegments.vip.avgSpend.toLocaleString('tr-TR')} ₺
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Weekly Stats Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Haftalık Randevu ve Gelir</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.weeklyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="bookings" fill="#3b82f6" name="Randevu" />
                  <Bar yAxisId="right" dataKey="revenue" fill="#10b981" name="Gelir (₺)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-predictions" className="space-y-6">
          {/* AI Predictions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5" />
                  Gelecek Hafta Tahmini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">
                      {ai.predictions.nextWeek.expectedBookings}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Beklenen Randevu
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${
                    ai.predictions.nextWeek.trend === 'up'
                      ? 'text-green-500'
                      : ai.predictions.nextWeek.trend === 'down'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                  }`}>
                    {ai.predictions.nextWeek.trend === 'up' && <TrendingUp className="h-6 w-6" />}
                    {ai.predictions.nextWeek.trend === 'down' && <TrendingDown className="h-6 w-6" />}
                    {ai.predictions.nextWeek.trend === 'stable' && <Clock className="h-6 w-6" />}
                    <span className="font-medium">
                      {ai.predictions.nextWeek.trend === 'up' && 'Yükseliş'}
                      {ai.predictions.nextWeek.trend === 'down' && 'Düşüş'}
                      {ai.predictions.nextWeek.trend === 'stable' && 'Stabil'}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Güven: %{ai.predictions.nextWeek.confidence}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Gelir Tahmini
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-3xl font-bold">
                      {ai.predictions.revenue.expectedRevenue.toLocaleString('tr-TR')} ₺
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Beklenen Gelir
                    </div>
                  </div>
                  <div className={`flex items-center gap-1 ${
                    ai.predictions.revenue.trend === 'up'
                      ? 'text-green-500'
                      : ai.predictions.revenue.trend === 'down'
                      ? 'text-red-500'
                      : 'text-yellow-500'
                  }`}>
                    {ai.predictions.revenue.trend === 'up' && <TrendingUp className="h-6 w-6" />}
                    {ai.predictions.revenue.trend === 'down' && <TrendingDown className="h-6 w-6" />}
                    {ai.predictions.revenue.trend === 'stable' && <Clock className="h-6 w-6" />}
                  </div>
                </div>

                <div className="text-sm text-muted-foreground">
                  Güven: %{ai.predictions.revenue.confidence}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* AI Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BrainCircuit className="h-5 w-5 text-primary" />
                AI Önerileri
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ai.predictions.recommendations.length > 0 ? (
                ai.predictions.recommendations.map((rec, i) => (
                  <Alert key={i} className="bg-primary/5">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{rec}</AlertDescription>
                  </Alert>
                ))
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  Şu an için öneri bulunmuyor
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          {/* Customer Segments */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-yellow-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">VIP Müşteriler</CardTitle>
                <Crown className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ai.customerSegments.vip.count}</div>
                <p className="text-xs text-muted-foreground">
                  Ort. {ai.customerSegments.vip.avgSpend.toLocaleString('tr-TR')} ₺ harcama
                </p>
              </CardContent>
            </Card>

            <Card className="bg-blue-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Düzenli Müşteriler</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ai.customerSegments.regular.count}</div>
                <p className="text-xs text-muted-foreground">
                  Ort. {ai.customerSegments.regular.avgSpend.toLocaleString('tr-TR')} ₺ harcama
                </p>
              </CardContent>
            </Card>

            <Card className="bg-red-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Riskli Müşteriler</CardTitle>
                <UserMinus className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ai.customerSegments.atRisk.count}</div>
                <p className="text-xs text-muted-foreground">
                  60 gündür görmedik
                </p>
              </CardContent>
            </Card>

            <Card className="bg-green-500/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Yeni Müşteriler</CardTitle>
                <UserPlus className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ai.customerSegments.new.count}</div>
                <p className="text-xs text-muted-foreground">
                  %{ai.customerSegments.new.conversionRate} dönüşüm oranı
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Peak Hours Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Yoğun Saatler</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ai.customerBehavior.peakHours}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="hour"
                    tickFormatter={(h) => `${h}:00`}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(h) => `${h}:00`}
                  />
                  <Bar dataKey="bookings" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Popüler Hizmetler</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.popularServices.slice(0, 5)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {data.popularServices.slice(0, 5).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Günlük Randevu Trendi</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.dailyBookings}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(d) => new Date(d).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                    />
                    <YAxis />
                    <Tooltip
                      labelFormatter={(d) => new Date(d).toLocaleDateString('tr-TR')}
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#3b82f6"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
