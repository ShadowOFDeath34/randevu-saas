'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Calendar, Clock, Scissors, User, X, CheckCircle, AlertCircle } from 'lucide-react'

interface Booking {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  service: { name: string; durationMinutes: number; price: number }
  staff: { fullName: string }
  notes: string | null
}

function PortalBookingsContent() {
  const searchParams = useSearchParams()
  const phone = searchParams.get('phone')

  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  useEffect(() => {
    if (phone) {
      fetchBookings()
    } else {
      setLoading(false)
    }
  }, [phone])

  const fetchBookings = async () => {
    try {
      const res = await fetch(`/api/portal/bookings?phone=${encodeURIComponent(phone!)}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setBookings(data)
    } catch (err) {
      setError('Randevularınız yüklenirken bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Randevunuzu iptal etmek istediğinize emin misiniz?')) return

    setCancellingId(bookingId)
    try {
      const res = await fetch(`/api/portal/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })

      if (res.ok) {
        setBookings(bookings.map(b =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ))
      } else {
        throw new Error('Cancel failed')
      }
    } catch (err) {
      alert('İptal işlemi başarısız oldu')
    } finally {
      setCancellingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    }
    const labels: Record<string, string> = {
      pending: 'Bekliyor',
      confirmed: 'Onaylandı',
      completed: 'Tamamlandı',
      cancelled: 'İptal Edildi',
      no_show: 'Gelmedi',
    }
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    )
  }

  const canCancel = (status: string) => ['pending', 'confirmed'].includes(status)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  if (!phone) {
    return (
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-gray-900 mb-2">Erişim Gerekli</h1>
            <p className="text-gray-600 mb-6">
              Randevularınızı görüntülemek için telefon numaranızı doğrulamanız gerekir.
            </p>
            <a
              href="/portal"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Giriş Yap
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Randevularım</h1>
          <p className="text-gray-600 mt-1">{phone}</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Henüz randevunuz yok</h2>
            <p className="text-gray-600 mb-6">
              Bu telefon numarası ile kayıtlı bir randevu bulunamadı.
            </p>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
            >
              Yeni Randevu Al
            </a>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900">{booking.service.name}</h3>
                      {getStatusBadge(booking.status)}
                    </div>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {booking.staff.fullName}
                    </p>
                  </div>
                  {canCancel(booking.status) && (
                    <button
                      onClick={() => cancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center gap-1 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      İptal Et
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{booking.bookingDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{booking.startTime} - {booking.endTime}</span>
                  </div>
                </div>

                {booking.notes && (
                  <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
                    Not: {booking.notes}
                  </p>
                )}

                {booking.status === 'cancelled' && (
                  <div className="mt-4 flex items-center gap-2 text-sm text-red-600">
                    <X className="w-4 h-4" />
                    Bu randevu iptal edildi
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default function PortalBookingsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    }>
      <PortalBookingsContent />
    </Suspense>
  )
}
