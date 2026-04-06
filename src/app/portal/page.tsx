'use client'

import { useState } from 'react'
import { Calendar, Clock, User, Scissors, CheckCircle, XCircle } from 'lucide-react'

interface Booking {
  id: string
  date: string
  time: string
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled'
  service: { name: string; price: number; durationMinutes: number }
  staff: { name: string }
}

export default function PortalPage() {
  const [phone, setPhone] = useState('')
  const [customer, setCustomer] = useState<{ id: string; name: string; phone: string } | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState<'phone' | 'verify' | 'portal'>('phone')
  const [code, setCode] = useState('')
  const [verificationId, setVerificationId] = useState('')

  const sendCode = async () => {
    if (!phone) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/portal/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      })
      const data = await res.json()

      if (res.ok) {
        setVerificationId(data.verificationId)
        setStep('verify')
      } else {
        setError(data.error || 'Bir hata oluştu')
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const verifyCode = async () => {
    if (!code || !verificationId) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/portal/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationId, code, phone })
      })
      const data = await res.json()

      if (res.ok) {
        setCustomer(data.customer)
        setBookings(data.bookings)
        setStep('portal')
      } else {
        setError(data.error || 'Kod hatalı')
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const cancelBooking = async (bookingId: string) => {
    if (!confirm('Randevuyu iptal etmek istediğinize emin misiniz?')) return

    try {
      const res = await fetch(`/api/portal/bookings/${bookingId}/cancel`, {
        method: 'POST'
      })
      if (res.ok) {
        setBookings(prev => prev.map(b =>
          b.id === bookingId ? { ...b, status: 'cancelled' } : b
        ))
      }
    } catch {
      alert('İptal sırasında hata oluştu')
    }
  }

  if (step === 'phone') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Randevularım</h1>
            <p className="text-gray-500 mt-2">Randevularınızı görüntülemek için telefon numaranızı girin</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Telefon Numarası</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0555 123 4567"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={sendCode}
              disabled={loading || !phone}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Gönderiliyor...' : 'Kod Gönder'}
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-6">
            İşletmenize özel randevu portalınız için /b/[slug] adresini kullanın
          </p>
        </div>
      </div>
    )
  }

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Doğrulama</h1>
            <p className="text-gray-500 mt-2">{phone} numarasına kod gönderildi</p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Doğrulama Kodu</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="000000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest"
                maxLength={6}
              />
            </div>

            <button
              onClick={verifyCode}
              disabled={loading || code.length !== 6}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'K...' : 'Gontrol Ediliyoririş Yap'}
            </button>

            <button
              onClick={() => setStep('phone')}
              className="w-full py-2 text-gray-500 hover:text-gray-700"
            >
              Numara değiştir
            </button>
          </div>
        </div>
      </div>
    )
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    confirmed: 'bg-green-100 text-green-800',
    completed: 'bg-gray-100 text-gray-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const statusLabels: Record<string, string> = {
    pending: 'Bekliyor',
    confirmed: 'Onaylandı',
    completed: 'Tamamlandı',
    cancelled: 'İptal Edildi'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Randevularım</h1>
            <button
              onClick={() => { setCustomer(null); setStep('phone'); setPhone(''); setCode(''); }}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Çıkış
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{customer?.name}</h2>
              <p className="text-sm text-gray-500">{customer?.phone}</p>
            </div>
          </div>
        </div>

        <h3 className="font-semibold text-gray-900 mb-4">Gelecek Randevular</h3>
        
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Henüz randevunuz yok</p>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
                      <Scissors className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{booking.service.name}</h4>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.date).toLocaleDateString('tr-TR', { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                          })}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.time}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {booking.staff.name}
                        </span>
                        <span>{booking.service.durationMinutes} dk</span>
                        <span className="font-medium text-indigo-600">{booking.service.price} TL</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[booking.status]}`}>
                      {statusLabels[booking.status]}
                    </span>
                    {booking.status === 'confirmed' && (
                      <button
                        onClick={() => cancelBooking(booking.id)}
                        className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" />
                        İptal et
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
