'use client'

import { useEffect, useState } from 'react'
import { db } from '@/lib/db'
import { CalendarDays, TrendingUp } from 'lucide-react'

interface DayStats {
  day: string
  bookings: number
  revenue: number
}

export function WeeklyStatsChart({ tenantId }: { tenantId: string }) {
  const [data, setData] = useState<DayStats[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

      const bookings = await db.booking.findMany({
        where: {
          tenantId,
          bookingDate: { gte: weekAgo.toISOString().split('T')[0] }
        },
        include: { service: true }
      })

      const dayNames = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz']
      const grouped = bookings.reduce((acc, booking) => {
        const date = new Date(booking.bookingDate)
        const dayIndex = date.getDay() === 0 ? 6 : date.getDay() - 1
        const dayName = dayNames[dayIndex]

        if (!acc[dayName]) {
          acc[dayName] = { day: dayName, bookings: 0, revenue: 0 }
        }
        acc[dayName].bookings += 1
        acc[dayName].revenue += booking.service?.price || 0
        return acc
      }, {} as Record<string, DayStats>)

      const chartData = dayNames.map(day => ({
        day,
        bookings: grouped[day]?.bookings || 0,
        revenue: grouped[day]?.revenue || 0
      }))

      setData(chartData)
      setLoading(false)
    }

    fetchData()
  }, [tenantId])

  const totalBookings = data.reduce((sum, d) => sum + d.bookings, 0)
  const maxBookings = Math.max(...data.map(d => d.bookings), 1)

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
            <CalendarDays className="w-4 h-4 text-violet-500" />
            Haftalık Trend
          </h3>
          <p className="text-xs text-neutral-500 mt-0.5">Randevu dağılımı</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-violet-600">{totalBookings}</p>
          <p className="text-xs text-neutral-400">Bu hafta</p>
        </div>
      </div>

      <div className="flex items-end justify-between gap-2 h-48">
        {data.map((day) => (
          <div key={day.day} className="flex-1 flex flex-col items-center gap-2">
            <div className="relative w-full flex justify-center">
              <div
                className="w-8 bg-violet-100 rounded-t-lg transition-all duration-500 hover:bg-violet-200"
                style={{ height: `${(day.bookings / maxBookings) * 120}px` }}
                title={`${day.day}: ${day.bookings} randevu`}
              />
              {day.bookings > 0 && (
                <span className="absolute -top-4 text-[10px] font-medium text-violet-600">
                  {day.bookings}
                </span>
              )}
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">{day.day}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
