'use client'

import { useEffect, useState } from 'react'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp } from 'lucide-react'

interface RevenueData {
  date: string
  revenue: number
  bookings: number
}

export function RevenueChart({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<RevenueData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/reports/revenue?period=week')
        if (!response.ok) throw new Error('Failed to fetch')

        const result = await response.json()

        // Transform dailyRevenue from API to chart format
        const dailyData = result.dailyRevenue || []
        const grouped: Record<string, RevenueData> = {}

        dailyData.forEach((day: { date: string; revenue: number; bookings: number }) => {
          const shortDate = day.date.slice(5) // MM-DD format
          grouped[day.date] = {
            date: shortDate,
            revenue: day.revenue,
            bookings: day.bookings
          }
        })

        // Fill in last 7 days
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000)
          return date.toISOString().split('T')[0]
        })

        const chartData = last7Days.map(date => ({
          date: date.slice(5),
          revenue: grouped[date]?.revenue || 0,
          bookings: grouped[date]?.bookings || 0
        }))

        setData(chartData)
      } catch (error) {
        console.error('Failed to fetch revenue data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [tenantId])

  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0)
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1)

  if (loading) {
    return (
      <div className="card-premium p-5 h-80 animate-pulse">
        <div className="h-4 bg-neutral-200 rounded w-1/3 mb-4" />
        <div className="h-48 bg-neutral-100 rounded" />
      </div>
    )
  }

  return (
    <div className="card-premium p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            Günlük Gelir
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">Son 7 gün</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-neutral-400">Toplam</p>
        </div>
      </div>

      <div className="h-48 flex items-end justify-between gap-2">
        {data.map((day) => (
          <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
            <div className="w-full flex flex-col gap-1">
              <div
                className="w-full bg-emerald-100 rounded-t transition-all duration-500 hover:bg-emerald-200"
                style={{ height: `${(day.revenue / maxRevenue) * 120}px` }}
                title={`${day.date}: ${formatCurrency(day.revenue)}`}
              />
            </div>
            <span className="text-[10px] text-neutral-400">{day.date}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
