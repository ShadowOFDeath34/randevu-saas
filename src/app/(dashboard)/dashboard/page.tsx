import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { formatDate, formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import { Suspense } from 'react'
import {
  Calendar,
  Users,
  ArrowRight,
  Plus,
  Scissors,
  UserPlus,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Wallet,
  Star,
  CalendarDays
} from 'lucide-react'
import { RevenueChart } from '@/components/dashboard/revenue-chart'
import { PopularServicesChart } from '@/components/dashboard/popular-services-chart'
import { WeeklyStatsChart } from '@/components/dashboard/weekly-stats-chart'

interface CustomerRisk {
  noShowProbability: number | null
  totalBookings: number
  noShowCount: number
}

async function getDashboardStats(tenantId: string) {
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const [
    todayBookings,
    weekBookings,
    monthBookings,
    totalCustomers,
    newCustomersThisMonth,
    recentBookings,
    pendingBookings,
    completedToday,
    weekRevenue,
    monthRevenue,
    popularServices,
    topStaff,
    reviewStats
  ] = await Promise.all([
    db.booking.count({ where: { tenantId, bookingDate: today } }),
    db.booking.count({ where: { tenantId, bookingDate: { gte: weekAgo } } }),
    db.booking.count({ where: { tenantId, bookingDate: { gte: monthAgo } } }),
    db.customer.count({ where: { tenantId } }),
    db.customer.count({ where: { tenantId, createdAt: { gte: new Date(monthAgo) } } }),
    db.booking.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { service: true, customer: true, staff: true }
    }),
    db.booking.findMany({
      where: { tenantId, status: 'pending' },
      orderBy: { bookingDate: 'asc' },
      take: 5,
      include: { customer: true, service: true, staff: true }
    }),
    db.booking.count({ where: { tenantId, bookingDate: today, status: 'completed' } }),
    db.booking.findMany({
      where: { tenantId, bookingDate: { gte: weekAgo }, status: 'completed' },
      include: { service: true }
    }),
    db.booking.findMany({
      where: { tenantId, bookingDate: { gte: monthAgo }, status: 'completed' },
      include: { service: true }
    }),
    db.service.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { bookings: { where: { bookingDate: { gte: monthAgo } } } } } },
      take: 5,
      orderBy: { bookings: { _count: 'desc' } }
    }),
    db.staff.findMany({
      where: { tenantId, isActive: true },
      include: { _count: { select: { bookings: { where: { bookingDate: { gte: monthAgo } } } } } },
      take: 5,
      orderBy: { bookings: { _count: 'desc' } }
    }),
    db.reviewRequest.groupBy({
      by: ['status'],
      where: { tenantId },
      _count: { id: true },
      _avg: { rating: true }
    })
  ])

  const calculateRevenue = (bookings: { service: { price: number | null } }[]) =>
    bookings.reduce((sum, b) => sum + (b.service?.price || 0), 0)

  return {
    todayBookings,
    weekBookings,
    monthBookings,
    totalCustomers,
    newCustomersThisMonth,
    recentBookings,
    pendingBookings,
    completedToday,
    weekRevenue: calculateRevenue(weekRevenue),
    monthRevenue: calculateRevenue(monthRevenue),
    popularServices,
    topStaff,
    reviewStats
  }
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  const tenantId = session.user.tenantId
  const stats = await getDashboardStats(tenantId)

  const statCards = [
    {
      label: 'Bugünkü Randevular',
      value: stats.todayBookings,
      subtext: `${stats.completedToday} tamamlandı`,
      icon: Calendar,
      trend: stats.weekBookings > 0 ? `+${((stats.todayBookings / stats.weekBookings) * 100).toFixed(0)}%` : '0%',
      trendUp: true,
      gradient: 'from-blue-500 to-blue-600',
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    },
    {
      label: 'Bu Hafta',
      value: stats.weekBookings,
      subtext: `${stats.monthBookings} bu ay`,
      icon: CalendarDays,
      trend: stats.monthBookings > 0 ? `+${((stats.weekBookings / stats.monthBookings) * 100).toFixed(0)}% aylık` : '—',
      trendUp: stats.weekBookings > 0,
      gradient: 'from-emerald-500 to-emerald-600',
      bg: 'bg-emerald-50',
      text: 'text-emerald-600'
    },
    {
      label: 'Aylık Gelir',
      value: formatCurrency(stats.monthRevenue),
      subtext: `${formatCurrency(stats.weekRevenue)} bu hafta`,
      icon: Wallet,
      trend: stats.monthRevenue > 0 ? `+${((stats.weekRevenue / stats.monthRevenue) * 100).toFixed(0)}%` : '0%',
      trendUp: true,
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600'
    },
    {
      label: 'Toplam Müşteri',
      value: stats.totalCustomers,
      subtext: `+${stats.newCustomersThisMonth} yeni`,
      icon: Users,
      trend: stats.totalCustomers > 0 ? `+${((stats.newCustomersThisMonth / stats.totalCustomers) * 100).toFixed(1)}%` : '0%',
      trendUp: true,
      gradient: 'from-violet-500 to-violet-600',
      bg: 'bg-violet-50',
      text: 'text-violet-600'
    },
    {
      label: 'Müşteri Memnuniyeti',
      value: (() => {
        const completedReviews = stats.reviewStats.find(r => r.status === 'completed')
        const avgRating = completedReviews?._avg?.rating || 0
        return avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : 'Henüz yok'
      })(),
      subtext: (() => {
        const completedCount = stats.reviewStats.find(r => r.status === 'completed')?._count?.id || 0
        const pendingCount = stats.reviewStats.find(r => r.status === 'pending')?._count?.id || 0
        return `${completedCount} değerlendirme${pendingCount > 0 ? `, ${pendingCount} bekliyor` : ''}`
      })(),
      icon: Star,
      trend: (() => {
        const completedCount = stats.reviewStats.find(r => r.status === 'completed')?._count?.id || 0
        return completedCount > 0 ? '★★★★★' : ''
      })(),
      trendUp: true,
      gradient: 'from-amber-500 to-amber-600',
      bg: 'bg-amber-50',
      text: 'text-amber-600'
    }
  ]

  const statusMap: Record<string, { label: string; style: string }> = {
    pending: { label: 'Bekliyor', style: 'bg-amber-50 text-amber-700 border border-amber-200' },
    confirmed: { label: 'Onaylandı', style: 'bg-emerald-50 text-emerald-700 border border-emerald-200' },
    completed: { label: 'Tamamlandı', style: 'bg-blue-50 text-blue-700 border border-blue-200' },
    cancelled: { label: 'İptal', style: 'bg-red-50 text-red-700 border border-red-200' },
    no_show: { label: 'Gelmedi', style: 'bg-neutral-100 text-neutral-600 border border-neutral-200' },
    arrived: { label: 'Geldi', style: 'bg-violet-50 text-violet-700 border border-violet-200' },
  }

  const getRiskBadge = (customer: CustomerRisk) => {
    let riskLevel = 'Düşük'
    let style = 'hidden'
    let probability = customer.noShowProbability || 0

    if (!probability && customer.totalBookings > 0) {
      probability = customer.noShowCount / customer.totalBookings
    }

    if (probability >= 0.4 || customer.noShowCount >= 2) {
      riskLevel = 'Yüksek Risk'
      style = 'bg-red-50 text-red-700 border border-red-200'
    } else if (probability >= 0.2 || customer.noShowCount === 1) {
      riskLevel = 'Orta Risk'
      style = 'bg-orange-50 text-orange-700 border border-orange-200'
    }

    if (style === 'hidden') return null

    return (
      <span title="AI Gelmemezlik Tahmini" className={`ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${style}`}>
        <Sparkles className="w-2.5 h-2.5 mr-0.5" />
        {riskLevel}
      </span>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Dashboard</h1>
          <p className="text-sm text-neutral-500 mt-0.5">İşletmenizin günlük özeti</p>
        </div>
        <Link href="/bookings/quick" className="btn-primary text-sm">
          <Plus className="w-4 h-4" />
          Yeni Randevu
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.label} className="card-premium p-5 animate-slide-up" style={{ animationDelay: `${i * 0.08}s`, animationFillMode: 'both' }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`${stat.bg} p-2.5 rounded-xl`}>
                <stat.icon className={`w-5 h-5 ${stat.text}`} />
              </div>
              {stat.trend && (
                <div className={`flex items-center gap-1 text-xs font-medium ${stat.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                  {stat.trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {stat.trend}
                </div>
              )}
            </div>
            <p className="text-3xl font-bold text-neutral-900 tracking-tight">{stat.value}</p>
            <p className="text-sm text-neutral-500 mt-0.5">{stat.label}</p>
            <p className="text-xs text-neutral-400 mt-1">{stat.subtext}</p>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Suspense fallback={<div className="card-premium h-80 animate-pulse" />}>
          <RevenueChart tenantId={tenantId} />
        </Suspense>
        <Suspense fallback={<div className="card-premium h-80 animate-pulse" />}>
          <PopularServicesChart services={stats.popularServices} />
        </Suspense>
        <Suspense fallback={<div className="card-premium h-80 animate-pulse" />}>
          <WeeklyStatsChart tenantId={tenantId} />
        </Suspense>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Son Randevular */}
        <div className="card-premium overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
            <h2 className="font-semibold text-neutral-900">Son Randevular</h2>
            <Link href="/bookings" className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1 transition-colors">
              Tümünü Gör <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="divide-y divide-neutral-100">
            {stats.recentBookings.length === 0 ? (
              <div className="p-8 text-center text-neutral-400 text-sm">Henüz randevu yok</div>
            ) : (
              stats.recentBookings.map((booking) => {
                const st = statusMap[booking.status] || statusMap.pending
                return (
                  <div key={booking.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 text-sm flex items-center">
                        <span className="truncate">{booking.customer.fullName}</span>
                        {getRiskBadge(booking.customer)}
                      </p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{booking.service.name} · {booking.staff.fullName}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs font-medium text-neutral-700">{formatDate(booking.bookingDate)} {booking.startTime}</p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1 ${st.style}`}>{st.label}</span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Onay Bekleyenler + Personel Performansı */}
        <div className="space-y-6">
          <div className="card-premium overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-semibold text-neutral-900">Onay Bekleyenler</h2>
                {stats.pendingBookings.length > 0 && (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold">{stats.pendingBookings.length}</span>
                )}
              </div>
            </div>
            <div className="divide-y divide-neutral-100">
              {stats.pendingBookings.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-sm">Onay bekleyen randevu yok</div>
              ) : (
                stats.pendingBookings.map((booking) => (
                  <div key={booking.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 text-sm flex items-center">
                        <span className="truncate">{booking.customer.fullName}</span>
                        {getRiskBadge(booking.customer)}
                      </p>
                      <p className="text-xs text-neutral-400 truncate mt-0.5">{booking.service.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-xs font-medium text-neutral-700">{formatDate(booking.bookingDate)} {booking.startTime}</p>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold mt-1 bg-amber-50 text-amber-700 border border-amber-200">Bekliyor</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Personel Performansı */}
          <div className="card-premium overflow-hidden">
            <div className="px-5 py-4 border-b border-neutral-100">
              <h2 className="font-semibold text-neutral-900 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-500" />
                Personel Performansı (Bu Ay)
              </h2>
            </div>
            <div className="divide-y divide-neutral-100">
              {stats.topStaff.length === 0 ? (
                <div className="p-8 text-center text-neutral-400 text-sm">Henüz veri yok</div>
              ) : (
                stats.topStaff.map((staff, index) => (
                  <div key={staff.id} className="px-5 py-3 flex items-center justify-between hover:bg-neutral-50/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${index === 0 ? 'bg-amber-100 text-amber-700' : index === 1 ? 'bg-neutral-200 text-neutral-600' : index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-500'}`}>
                        {index + 1}
                      </div>
                      <span className="font-medium text-neutral-900 text-sm">{staff.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-500">{staff._count.bookings} randevu</span>
                      <div className="w-16 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(100, (staff._count.bookings / (stats.topStaff[0]?._count.bookings || 1)) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div className="card-premium p-5">
        <h2 className="font-semibold text-neutral-900 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { href: '/bookings?new=true', icon: Calendar, label: 'Yeni Randevu', color: 'text-blue-600', bg: 'bg-blue-50 hover:bg-blue-100' },
            { href: '/services', icon: Scissors, label: 'Hizmet Ekle', color: 'text-emerald-600', bg: 'bg-emerald-50 hover:bg-emerald-100' },
            { href: '/staff', icon: UserPlus, label: 'Personel Ekle', color: 'text-amber-600', bg: 'bg-amber-50 hover:bg-amber-100' },
            { href: `/kiosk/${session.user.tenantSlug}`, icon: Sparkles, label: 'Kiosk Modu', color: 'text-violet-600', bg: 'bg-violet-50 hover:bg-violet-100 ring-1 ring-violet-200' },
          ].map(item => (
            <Link key={item.href} href={item.href} className={`p-4 rounded-xl ${item.bg} transition-all duration-200 text-center group`}>
              <item.icon className={`w-7 h-7 mx-auto ${item.color} mb-2 group-hover:scale-110 transition-transform`} />
              <span className="text-sm font-medium text-neutral-700">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
