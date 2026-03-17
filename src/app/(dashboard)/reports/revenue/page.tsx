'use client'

import { useState, useEffect } from 'react'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Download,
  PieChart,
  BarChart3
} from 'lucide-react'

interface RevenueData {
  summary: {
    totalRevenue: number
    totalBookings: number
    averageRevenuePerBooking: number
    revenueGrowth: number
  }
  dailyRevenue: Array<{
    date: string
    revenue: number
    bookings: number
  }>
  serviceBreakdown: Array<{
    name: string
    revenue: number
    count: number
  }>
}

export default function RevenueReportPage() {
  const [data, setData] = useState<RevenueData | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month')

  useEffect(() => {
    fetchData()
  }, [period])

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/reports/revenue?period=${period}`)
      const data = await res.json()
      setData(data)
    } catch (error) {
      console.error('Error fetching revenue:', error)
    } finally {
      setLoading(false)
    }
  }

  const downloadCSV = () => {
    if (!data) return

    const csvContent = [
      ['Tarih', 'Gelir', 'Randevu Sayısı'],
      ...data.dailyRevenue.map(d => [d.date, d.revenue.toString(), d.bookings.toString()])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `gelir-raporu-${period}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (!data) {
    return <div className="text-center py-12 text-gray-500">Veri yüklenemedi</div>
  }

  const { summary, dailyRevenue, serviceBreakdown } = data

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gelir Raporu</h1>
          <p className="text-gray-500 mt-1">Detaylı gelir ve performans analizi</p>
        </div>
        <div className="flex gap-3">
          <div className="flex bg-white border border-gray-200 rounded-lg p-1">
            {(['week', 'month', 'year'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {p === 'week' ? 'Hafta' : p === 'month' ? 'Ay' : 'Yıl'}
              </button>
            ))}
          </div>
          <button
            onClick={downloadCSV}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV İndir
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Gelir</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalRevenue.toLocaleString('tr-TR')}₺
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            {summary.revenueGrowth >= 0 ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : (
              <TrendingDown className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              summary.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              %{Math.abs(summary.revenueGrowth).toFixed(1)}
            </span>
            <span className="text-sm text-gray-500">önceki döneme göre</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Toplam Randevu</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {summary.totalBookings}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Ortalama Gelir</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Math.round(summary.averageRevenuePerBooking).toLocaleString('tr-TR')}₺
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hizmet Sayısı</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {serviceBreakdown.length}
              </p>
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <PieChart className="w-6 h-6 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Daily Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Günlük Gelir</h2>
          <div className="h-64 flex items-end gap-2">
            {dailyRevenue.map((day, index) => {
              const maxRevenue = Math.max(...dailyRevenue.map(d => d.revenue))
              const height = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0

              return (
                <div key={day.date} className="flex-1 flex flex-col items-center">
                  <div className="w-full relative">
                    <div
                      className="bg-indigo-600 rounded-t transition-all duration-500"
                      style={{ height: `${Math.max(height, 4)}px` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-gray-600 opacity-0 hover:opacity-100">
                      {day.revenue.toLocaleString('tr-TR')}₺
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(day.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Service Breakdown */}
        <div className="bg-white p-6 rounded-xl border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Hizmet Bazlı Gelir</h2>
          <div className="space-y-4">
            {serviceBreakdown.slice(0, 6).map((service, index) => {
              const maxRevenue = Math.max(...serviceBreakdown.map(s => s.revenue))
              const percentage = maxRevenue > 0 ? (service.revenue / maxRevenue) * 100 : 0

              return (
                <div key={service.name}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-900">{service.name}</span>
                    <span className="text-sm text-gray-500">
                      {service.revenue.toLocaleString('tr-TR')}₺ ({service.count} randevu)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Daily Revenue Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">Günlük Detay</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Randevu</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gelir</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ortalama</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {dailyRevenue.slice().reverse().map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString('tr-TR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 text-right">{day.bookings}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                    {day.revenue.toLocaleString('tr-TR')}₺
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-right">
                    {day.bookings > 0 ? Math.round(day.revenue / day.bookings) : 0}₺
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
