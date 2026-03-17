'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { useBookings, useUpdateBooking } from '@/hooks/use-bookings'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingStatus } from '@prisma/client'

interface BookingView {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  confirmationCode: string
  service: { name: string }
  customer: { fullName: string; phone: string }
  staff: { fullName: string }
}

export default function BookingsPage() {
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  const { data: bookings = [], isLoading, error } = useBookings(
    filter !== 'all' ? { status: filter as any } : undefined
  )
  const updateMutation = useUpdateBooking()

  const updateStatus = async (id: string, status: string) => {
    updateMutation.mutate({ id, data: { status: status as BookingStatus } })
  }

  const filteredBookings = (bookings as unknown as BookingView[]).filter((b) =>
    b.customer.fullName.toLowerCase().includes(search.toLowerCase()) ||
    b.confirmationCode.toLowerCase().includes(search.toLowerCase())
  )

  const statusLabels: Record<string, string> = {
    pending: 'Bekliyor',
    confirmed: 'Onaylandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal',
    no_show: 'Gelmedi'
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-blue-100 text-blue-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-gray-100 text-gray-800'
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200">
          <Skeleton className="h-12 w-full" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-10 text-red-600">
        Randevular yüklenirken hata oluştu. Lütfen sayfayı yenileyin.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Randevular</h1>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Müşteri ara..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          >
            <option value="all">Tümü</option>
            <option value="pending">Bekleyen</option>
            <option value="confirmed">Onaylanan</option>
            <option value="completed">Tamamlanan</option>
            <option value="cancelled">İptal</option>
            <option value="no_show">Gelmedi</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Müşteri</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hizmet</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Personel</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tarih/Saat</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Durum</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">İşlem</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredBookings.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-gray-500">
                  Randevu bulunamadı
                </td>
              </tr>
            ) : (
              filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">{booking.customer.fullName}</div>
                    <div className="text-sm text-gray-500">{booking.customer.phone}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.service.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{booking.staff.fullName}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{formatDate(booking.bookingDate)}</div>
                    <div className="text-sm text-gray-500">{booking.startTime} - {booking.endTime}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <select
                      value={booking.status}
                      onChange={(e) => updateStatus(booking.id, e.target.value)}
                      disabled={updateMutation.isPending}
                      className="text-sm border border-gray-300 rounded px-2 py-1 disabled:opacity-50"
                    >
                      <option value="pending">Bekliyor</option>
                      <option value="confirmed">Onaylandı</option>
                      <option value="completed">Tamamlandı</option>
                      <option value="cancelled">İptal</option>
                      <option value="no_show">Gelmedi</option>
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
