'use client'

import { useState, useEffect } from 'react'
import { formatDate, formatTime, addMinutesToTime, timeToMinutes } from '@/lib/utils'

interface Booking {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  service: { name: string; durationMinutes: number }
  customer: { fullName: string; phone: string }
  staff: { fullName: string }
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'week' | 'day'>('week')
  const [selectedStaff, setSelectedStaff] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [currentDate, view, selectedStaff])

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const startDate = getStartDate()
      const endDate = getEndDate()
      
      const res = await fetch(`/api/calendar?start=${startDate}&end=${endDate}&staffId=${selectedStaff}`)
      const data = await res.json()
      setBookings(data)
    } catch (error) {
      console.error('Error fetching bookings:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStartDate = () => {
    if (view === 'week') {
      const d = new Date(currentDate)
      const day = d.getDay()
      d.setDate(d.getDate() - day)
      return d.toISOString().split('T')[0]
    }
    return currentDate.toISOString().split('T')[0]
  }

  const getEndDate = () => {
    if (view === 'week') {
      const d = new Date(currentDate)
      const day = d.getDay()
      d.setDate(d.getDate() + (6 - day))
      return d.toISOString().split('T')[0]
    }
    return currentDate.toISOString().split('T')[0]
  }

  const getWeekDays = () => {
    const days = []
    const start = new Date(getStartDate())
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(start.getDate() + i)
      days.push(d)
    }
    return days
  }

  const getHours = () => {
    const hours = []
    for (let h = 8; h <= 20; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`)
    }
    return hours
  }

  const getBookingsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(b => b.bookingDate === dateStr)
  }

  const getBookingStyle = (booking: Booking) => {
    const startMinutes = timeToMinutes(booking.startTime)
    const endMinutes = timeToMinutes(booking.endTime)
    const top = ((startMinutes - 8 * 60) / 60) * 60
    const height = ((endMinutes - startMinutes) / 60) * 60
    return { top: `${top}px`, height: `${height}px` }
  }

  const navigate = (direction: number) => {
    const d = new Date(currentDate)
    if (view === 'week') {
      d.setDate(d.getDate() + direction * 7)
    } else {
      d.setDate(d.getDate() + direction)
    }
    setCurrentDate(d)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 border-yellow-300',
    confirmed: 'bg-green-100 border-green-300',
    completed: 'bg-blue-100 border-blue-300',
    cancelled: 'bg-red-100 border-red-300',
    no_show: 'bg-gray-100 border-gray-300'
  }

  const weekDays = getWeekDays()
  const hours = getHours()

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Takvim</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              ←
            </button>
            <button
              onClick={goToToday}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
            >
              Bugün
            </button>
            <button
              onClick={() => navigate(1)}
              className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              →
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <select
              value={view}
              onChange={(e) => setView(e.target.value as 'week' | 'day')}
              className="px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="week">Haftalık</option>
              <option value="day">Günlük</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-20">Yükleniyor...</div>
        ) : view === 'week' ? (
          <div className="overflow-x-auto">
            <div className="min-w-[800px]">
              <div className="grid grid-cols-8 border-b border-gray-200">
                <div className="p-3 text-center text-sm text-gray-500 border-r"></div>
                {weekDays.map((day, i) => {
                  const isToday = day.toDateString() === new Date().toDateString()
                  return (
                    <div 
                      key={i} 
                      className={`p-3 text-center border-r ${isToday ? 'bg-indigo-50' : ''}`}
                    >
                      <div className="text-xs text-gray-500">
                        {day.toLocaleDateString('tr-TR', { weekday: 'short' })}
                      </div>
                      <div className={`text-lg font-medium ${isToday ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {day.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
              
              <div className="relative">
                {hours.map((hour, i) => (
                  <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
                    <div className="p-2 text-xs text-gray-500 text-center border-r h-[60px]">
                      {hour}
                    </div>
                    {weekDays.map((day, j) => {
                      const dayBookings = getBookingsForDay(day).filter(b => {
                        const bh = parseInt(b.startTime.split(':')[0])
                        return bh === parseInt(hour.split(':')[0])
                      })
                      return (
                        <div 
                          key={`${i}-${j}`} 
                          className="border-r h-[60px] relative hover:bg-gray-50"
                        >
                          {dayBookings.map(booking => {
                            const style = getBookingStyle(booking)
                            return (
                              <div
                                key={booking.id}
                                className={`absolute left-1 right-1 rounded p-1 text-xs ${statusColors[booking.status]} border-l-2`}
                                style={style}
                              >
                                <div className="font-medium truncate">{booking.customer.fullName}</div>
                                <div className="truncate opacity-75">{booking.service.name}</div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="text-center mb-4">
              <h2 className="text-lg font-semibold">
                {currentDate.toLocaleDateString('tr-TR', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long',
                  year: 'numeric'
                })}
              </h2>
            </div>
            <div className="space-y-2">
              {getBookingsForDay(currentDate)
                .sort((a, b) => a.startTime.localeCompare(b.startTime))
                .map(booking => (
                  <div 
                    key={booking.id}
                    className={`p-4 rounded-lg border-l-4 ${statusColors[booking.status]}`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{booking.customer.fullName}</p>
                        <p className="text-sm text-gray-600">{booking.service.name}</p>
                        <p className="text-sm text-gray-500">{booking.customer.phone}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{booking.startTime} - {booking.endTime}</p>
                        <p className="text-sm text-gray-500">{booking.staff.fullName}</p>
                      </div>
                    </div>
                  </div>
                ))}
              {getBookingsForDay(currentDate).length === 0 && (
                <div className="text-center py-10 text-gray-500">
                  Bu gün için randevu yok
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
