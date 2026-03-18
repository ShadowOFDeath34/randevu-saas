'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronRight, Clock, Calendar, User, CheckCircle2, Sparkles } from 'lucide-react'

interface Service {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: number | null
}

interface Staff {
  id: string
  fullName: string
}

interface Slot {
  time: string
  staff: { id: string; name: string }[]
}

interface Tenant {
  id: string
  name: string
  slug: string
}

interface Props {
  tenant: Tenant
  services: Service[]
  staff: Staff[]
  dates: string[]
}

const steps = [
  { num: 1, label: 'Hizmet', icon: Sparkles },
  { num: 2, label: 'Tarih', icon: Calendar },
  { num: 3, label: 'Saat', icon: Clock },
  { num: 4, label: 'Bilgiler', icon: User },
]

export default function BookingForm({ tenant, services, staff, dates }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedStaff, setSelectedStaff] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [slots, setSlots] = useState<Slot[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')

  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    notes: ''
  })

  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchSlots()
    }
  }, [selectedDate, selectedService, selectedStaff])

  const fetchSlots = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        date: selectedDate,
        serviceId: selectedService?.id || ''
      })
      if (selectedStaff) {
        params.append('staffId', selectedStaff)
      }

      const res = await fetch(`/api/public/${tenant.slug}/slots?${params}`)
      const data = await res.json()
      
      if (data.slots) {
        setSlots(data.slots)
      }
    } catch (_err) {
      console.error('Error fetching slots:', _err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const staffMember = selectedTime 
        ? slots.find(s => s.time === selectedTime)?.staff[0]
        : null

      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: tenant.slug,
          customerName: customerData.name,
          customerPhone: customerData.phone,
          customerEmail: customerData.email || undefined,
          customerNotes: customerData.notes || undefined,
          serviceId: selectedService?.id,
          staffId: selectedStaff || staffMember?.id,
          bookingDate: selectedDate,
          startTime: selectedTime
        })
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Randevu oluşturulamadı')
        return
      }

      setConfirmationCode(data.confirmationCode)
      setSuccess(true)
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Success Screen ──
  if (success) {
    return (
      <div className="text-center py-10 animate-scale-in">
        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto mb-5 border border-green-100">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Randevunuz Oluşturuldu!</h2>
        <p className="text-neutral-500 mb-6 max-w-sm mx-auto leading-relaxed">
          Randevunuz başarıyla oluşturuldu. Onay kodunuz:
        </p>
        <div className="inline-flex items-center gap-2 px-5 py-3 bg-primary-50 text-primary-700 rounded-xl font-mono text-lg font-bold border border-primary-100">
          {confirmationCode}
        </div>
        <p className="text-xs text-neutral-400 mt-6">
          Size en kısa sürede SMS veya e-posta ile bilgi gönderilecektir.
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* ── Stepper Progress ── */}
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center flex-1">
            <button
              type="button"
              onClick={() => {
                if (s.num < step) setStep(s.num)
              }}
              className={`flex items-center gap-2 transition-all duration-300 ${
                s.num < step
                  ? 'cursor-pointer'
                  : s.num === step
                  ? 'cursor-default'
                  : 'cursor-default opacity-40'
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                s.num < step
                  ? 'bg-success text-white shadow-sm'
                  : s.num === step
                  ? 'bg-primary-600 text-white shadow-md shadow-primary-600/25'
                  : 'bg-neutral-100 text-neutral-400'
              }`}>
                {s.num < step ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${
                s.num <= step ? 'text-neutral-700' : 'text-neutral-400'
              }`}>
                {s.label}
              </span>
            </button>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 rounded-full transition-all duration-500 ${
                s.num < step ? 'bg-success' : 'bg-neutral-100'
              }`} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 mb-6 animate-scale-in">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* ── Step 1: Service Selection ── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <p className="text-sm text-neutral-500 mb-4">Almak istediğiniz hizmeti seçin.</p>
            <div className="grid gap-3">
              {services.map(service => (
                <button
                  key={service.id}
                  type="button"
                  onClick={() => {
                    setSelectedService(service)
                    setStep(2)
                  }}
                  className={`group p-4 border rounded-xl text-left transition-all duration-200 hover:shadow-premium-sm ${
                    selectedService?.id === service.id
                      ? 'border-primary-400 bg-primary-50/50 ring-2 ring-primary-500/10'
                      : 'border-neutral-200 hover:border-primary-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-neutral-400 mt-0.5">{service.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <div className="flex items-center gap-1 text-sm text-neutral-500">
                        <Clock className="w-3.5 h-3.5" />
                        {service.durationMinutes} dk
                      </div>
                      {service.price != null && (
                        <p className="text-sm font-semibold text-primary-600 mt-0.5">{service.price} ₺</p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Staff & Date Selection ── */}
        {step === 2 && selectedService && (
          <div className="space-y-6 animate-slide-up">
            {/* Staff */}
            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-2">
                Personel Tercihi
              </label>
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="input-premium"
              >
                <option value="">Fark etmez</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.fullName}</option>
                ))}
              </select>
            </div>

            {/* Dates */}
            <div>
              <p className="text-sm text-neutral-500 mb-3">Randevu tarihinizi seçin.</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                {dates.map(date => {
                  const dateObj = new Date(date)
                  const dayName = dateObj.toLocaleDateString('tr-TR', { weekday: 'short' })
                  const dayNum = dateObj.getDate()
                  const monthName = dateObj.toLocaleDateString('tr-TR', { month: 'short' })
                  
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        setSelectedDate(date)
                        setSelectedTime('')
                        setStep(3)
                      }}
                      className={`p-2.5 border rounded-xl text-center transition-all duration-200 hover:shadow-sm ${
                        selectedDate === date
                          ? 'border-primary-400 bg-primary-50 ring-2 ring-primary-500/10'
                          : 'border-neutral-200 hover:border-primary-300'
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-neutral-400 font-medium">{dayName}</div>
                      <div className="text-lg font-bold text-neutral-900 leading-tight">{dayNum}</div>
                      <div className="text-[10px] text-neutral-400">{monthName}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Step 3: Time Selection ── */}
        {step === 3 && selectedDate && (
          <div className="animate-slide-up">
            <p className="text-sm text-neutral-500 mb-4">Uygun bir saat seçin.</p>
            {loading ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skeleton h-11 rounded-xl" />
                ))}
              </div>
            ) : slots.length === 0 ? (
              <div className="text-center py-10">
                <Calendar className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
                <p className="text-neutral-500 text-sm">Bu tarih için uygun saat bulunamadı.</p>
                <button type="button" onClick={() => setStep(2)} className="text-primary-600 font-medium text-sm mt-2 hover:underline">
                  Başka tarih seçin
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {slots.map(slot => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => {
                      setSelectedTime(slot.time)
                      setStep(4)
                    }}
                    className={`py-2.5 px-3 border rounded-xl text-center font-medium text-sm transition-all duration-200 hover:shadow-sm ${
                      selectedTime === slot.time
                        ? 'border-primary-400 bg-primary-50 text-primary-700 ring-2 ring-primary-500/10'
                        : 'border-neutral-200 text-neutral-700 hover:border-primary-300'
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Step 4: Customer Info ── */}
        {step === 4 && selectedTime && (
          <div className="space-y-5 animate-slide-up">
            {/* Summary Card */}
            <div className="bg-primary-50/50 border border-primary-100 rounded-xl p-4">
              <p className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-2">Seçiminiz</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-neutral-400">Hizmet:</span>
                  <p className="font-medium text-neutral-800">{selectedService?.name}</p>
                </div>
                <div>
                  <span className="text-neutral-400">Süre:</span>
                  <p className="font-medium text-neutral-800">{selectedService?.durationMinutes} dakika</p>
                </div>
                <div>
                  <span className="text-neutral-400">Tarih:</span>
                  <p className="font-medium text-neutral-800">
                    {new Date(selectedDate).toLocaleDateString('tr-TR', { 
                      day: 'numeric', month: 'long', year: 'numeric' 
                    })}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400">Saat:</span>
                  <p className="font-medium text-neutral-800">{selectedTime}</p>
                </div>
              </div>
              {selectedService?.price != null && (
                <div className="mt-3 pt-3 border-t border-primary-100 flex justify-between items-center">
                  <span className="text-sm text-neutral-500">Toplam:</span>
                  <span className="text-lg font-bold text-primary-700">{selectedService.price} ₺</span>
                </div>
              )}
            </div>

            {/* Customer Form */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">Ad Soyad</label>
                <input
                  type="text"
                  value={customerData.name}
                  onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                  required
                  className="input-premium"
                  placeholder="Ahmet Yılmaz"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">Telefon</label>
                <input
                  type="tel"
                  value={customerData.phone}
                  onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                  required
                  className="input-premium"
                  placeholder="0535 123 4567"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">E-posta <span className="text-neutral-400">(İsteğe bağlı)</span></label>
              <input
                type="email"
                value={customerData.email}
                onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                className="input-premium"
                placeholder="ahmet@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-600 mb-1.5">Not <span className="text-neutral-400">(İsteğe bağlı)</span></label>
              <textarea
                value={customerData.notes}
                onChange={(e) => setCustomerData({ ...customerData, notes: e.target.value })}
                rows={2}
                className="input-premium resize-none"
                placeholder="Özel bir isteğiniz var mı?"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full py-3.5 text-sm"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Randevu Oluşturuluyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Randevuyu Onayla
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  )
}
