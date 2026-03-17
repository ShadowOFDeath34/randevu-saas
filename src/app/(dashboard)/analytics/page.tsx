'use client'

import { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Calendar,
  Users,
  Scissors,
  DollarSign,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface Stats {
  totalBookings: number
  completedBookings: number
  cancelledBookings: number
  noShowBookings: number
  totalRevenue: number
  totalCustomers: number
  repeatCustomers: number
  averageRating: number
  popularServices: { name: string; count: number }[]
  topStaff: { name: string; count: number }[]
  dailyBookings: { date: string; count: number }[]
  weeklyStats: { day: string; bookings: number; revenue: number }[]
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/analytics?period=${period}`)
      const data = await res.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-gray-500">
        Veri yüklenemedi
      </div>
    )
  }

  const completionRate = stats.totalBookings > 0 
    ? Math.round((stats.completedBookings / stats.totalBookings) * 100) 
    : 0

  const noShowRate = stats.totalBookings > 0 
    ? Math.round((stats.noShowBookings / stats.totalBookings) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">İstatistikler</h1>
        
        <div className="flex gap-2">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {p === 'week' ? 'Bu Hafta' : p === 'month' ? 'Bu Ay' : 'Bu Yıl'}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Randevu</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalBookings}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> {completionRate}%
            </span>
            <span className="text-gray-500">tamamlandı</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Gelir</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalRevenue.toLocaleString('tr-TR')}₺</p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <TrendingUp className="w-4 h-4" /> +12%
            </span>
            <span className="text-gray-500">geçen döneme göre</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Müşteri</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalCustomers}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-green-600 flex items-center gap-1">
              <ArrowUp className="w-4 h-4" /> {stats.repeatCustomers}
            </span>
            <span className="text-gray-500">tekrar gelen</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">No-Show Oranı</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{noShowRate}%</p>
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-500">{stats.noShowBookings} randevu</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Popular Services */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">En Popüler Hizmetler</h2>
          <div className="space-y-4">
            {stats.popularServices.slice(0, 5).map((service, index) => (
              <div key={service.name} className="flex items-center gap-4">
                <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{service.name}</span>
                    <span className="text-sm text-gray-500">{service.count} randevu</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${(service.count / stats.popularServices[0]?.count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Staff */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">En Aktif Personel</h2>
          <div className="space-y-4">
            {stats.topStaff.slice(0, 5).map((staff, index) => (
              <div key={staff.name} className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                  {staff.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{staff.name}</span>
                    <span className="text-sm text-gray-500">{staff.count} randevu</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${(staff.count / stats.topStaff[0]?.count) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Stats */}
      <div className="bg-white p-6 rounded-xl border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Haftalık Performans</h2>
        <div className="grid grid-cols-7 gap-4">
          {stats.weeklyStats.map((day) => (
            <div key={day.day} className="text-center">
              <p className="text-xs text-gray-500 mb-2">{day.day}</p>
              <div className="h-24 flex flex-col justify-end">
                <div 
                  className="bg-indigo-600 rounded-t mx-auto w-full"
                  style={{ height: `${Math.min((day.bookings / 20) * 100, 100)}%`, minHeight: day.bookings > 0 ? '8px' : '0' }}
                />
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2">{day.bookings}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
