'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, Calendar } from 'lucide-react'

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
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const bookings = await db.booking.findMany({
        where: {
          tenantId,
          status: 'completed',
          bookingDate: { gte: weekAgo.toISOString().split('T')[0] }
        },
        include: { service: true },
        orderBy: { bookingDate: 'asc' }
      })

      const grouped = bookings.reduce((acc, booking) => {
        const date = booking.bookingDate
        if (!acc[date]) {
          acc[date] = { date, revenue: 0, bookings: 0 }
        }
        acc[date].revenue += booking.service?.price || 0
        acc[date].bookings += 1
        return acc
      }, {} as Record<string, RevenueData>)

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
      setLoading(false)
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
        {data.map((day, i) => (
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
