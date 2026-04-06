'use client'

import { useState, useEffect, useRef } from 'react'
import { useServices } from '@/hooks/use-services'
import { useStaff } from '@/hooks/use-staff'
import { useCustomers } from '@/hooks/use-customers'
import { useCreateBooking } from '@/hooks/use-bookings'
import { addMinutesToTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Sparkles, Clock, Star, TrendingUp, CheckCircle2, AlertCircle } from 'lucide-react'

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: number
}

interface Staff {
  id: string
  name: string
}

interface Customer {
  id: string
  name: string
  phone: string
}

interface StaffScore {
  staffId: string
  fullName: string
  score: number
  factors: {
    skillMatch: number
    availability: number
    workload: number
    customerPreference: number
    proximity: number
  }
  currentLoad: number
  canServe: boolean
}

export default function QuickBookingPage() {
  const { data: services = [], isLoading: servicesLoading } = useServices()
  const { data: staff = [], isLoading: staffLoading } = useStaff()
  const { data: customersData, isLoading: customersLoading } = useCustomers()
  const createBooking = useCreateBooking()

  const customers = customersData?.data || []

  const [success, setSuccess] = useState(false)
  const [existingCustomer, setExistingCustomer] = useState(true)
  const initialValuesSet = useRef(false)
  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    serviceId: '',
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  })

  // AI Routing states
  const [staffScores, setStaffScores] = useState<StaffScore[]>([])
  const [loadingScores, setLoadingScores] = useState(false)
  const [showSmartSuggestions, setShowSmartSuggestions] = useState(false)
  const [selectedServiceDuration, setSelectedServiceDuration] = useState(30)

  // Set initial values when data loads - using ref to prevent cascading renders
  useEffect(() => {
    if (initialValuesSet.current) return
    if (services.length > 0 || staff.length > 0) {
      initialValuesSet.current = true
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setFormData(prev => ({
          ...prev,
          serviceId: services.length > 0 ? services[0].id : prev.serviceId,
          staffId: staff.length > 0 ? staff[0].id : prev.staffId
        }))
      }, 0)
    }
  }, [services, staff])

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find((c: Customer) => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.name,
        customerPhone: customer.phone
      }))
    }
  }

  // Fetch AI staff scores when service/date/time changes
  const fetchStaffScores = async () => {
    if (!formData.serviceId || !formData.date || !formData.time) return

    const service = services.find((s: Service) => s.id === formData.serviceId)
    if (!service) return

    setLoadingScores(true)
    try {
      const endTime = addMinutesToTime(formData.time, service.durationMinutes)
      const response = await fetch(
        `/api/routing?serviceId=${formData.serviceId}&date=${formData.date}&startTime=${formData.time}&endTime=${endTime}${formData.customerId ? `&customerId=${formData.customerId}` : ''}`
      )
      if (response.ok) {
        const data = await response.json()
        setStaffScores(data.scores || [])
        setShowSmartSuggestions(data.scores?.length > 0)
      }
    } catch (error) {
      console.error('Error fetching staff scores:', error)
    } finally {
      setLoadingScores(false)
    }
  }

  // Auto-fetch scores when relevant fields change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.serviceId && formData.date && formData.time) {
        fetchStaffScores()
      }
    }, 500) // Debounce
    return () => clearTimeout(timer)
  }, [formData.serviceId, formData.date, formData.time, formData.customerId])

  const handleServiceChange = (serviceId: string) => {
    const service = services.find((s: Service) => s.id === serviceId)
    setFormData(prev => ({ ...prev, serviceId }))
    if (service) {
      setSelectedServiceDuration(service.durationMinutes)
    }
  }

  const handleSmartStaffSelect = (staffId: string) => {
    setFormData(prev => ({ ...prev, staffId }))
    setShowSmartSuggestions(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50 border-green-200'
    if (score >= 60) return 'text-blue-600 bg-blue-50 border-blue-200'
    if (score >= 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200'
    return 'text-gray-600 bg-gray-50 border-gray-200'
  }

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Mükemmel'
    if (score >= 60) return 'İyi'
    if (score >= 40) return 'Ortalama'
    return 'Düşük'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const service = services.find((s: Service) => s.id === formData.serviceId)
    const endTime = addMinutesToTime(formData.time, service?.durationMinutes || 30)

    await createBooking.mutateAsync({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      serviceId: formData.serviceId,
      staffId: formData.staffId,
      startTime: `${formData.date}T${formData.time}`,
      endTime: `${formData.date}T${endTime}`,
    })

    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setFormData(prev => ({
        ...prev,
        customerId: '',
        customerName: '',
        customerPhone: ''
      }))
    }, 2000)
  }

  const isLoading = servicesLoading || staffLoading || customersLoading

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
          <Skeleton className="h-10 w-full" />
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Hızlı Randevu</h1>

      {success && (
        <div className="bg-green-50 text-green-600 p-4 rounded-lg mb-6">
          Randevu başarıyla oluşturuldu!
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="flex items-center gap-2 mb-3">
            <input
              type="checkbox"
              checked={existingCustomer}
              onChange={(e) => setExistingCustomer(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700">Mevcut müşteri</span>
          </label>

          {existingCustomer ? (
            <select
              value={formData.customerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              <option value="">Müşteri seçin</option>
              {customers.map((c: Customer) => (
                <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>
              ))}
            </select>
          ) : (
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Müşteri adı"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
              <input
                type="tel"
                placeholder="Telefon"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hizmet</label>
            <select
              value={formData.serviceId}
              onChange={(e) => handleServiceChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              {services.map((s: Service) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.durationMinutes} dk)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Personel</label>
            <select
              value={formData.staffId}
              onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              {staff.map((s: Staff) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            {/* AI Smart Suggestions */}
            {loadingScores && (
              <div className="mt-3 flex items-center gap-2 text-sm text-indigo-600">
                <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                AI en uygun personelleri analiz ediyor...
              </div>
            )}

            {!loadingScores && showSmartSuggestions && staffScores.length > 0 && (
              <div className="mt-3 p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-100">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900">AI Önerisi</span>
                  <span className="text-xs text-indigo-600">En uygun personeller</span>
                </div>
                <div className="space-y-2">
                  {staffScores.slice(0, 3).map((score) => (
                    <button
                      key={score.staffId}
                      type="button"
                      onClick={() => handleSmartStaffSelect(score.staffId)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg border transition-all hover:shadow-sm ${
                        formData.staffId === score.staffId
                          ? 'border-indigo-500 bg-indigo-50'
                          : 'border-gray-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${getScoreColor(score.score)}`}>
                          {Math.round(score.score)}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-gray-900">{score.fullName}</p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Müsait
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {score.currentLoad} randevu
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${getScoreColor(score.score)}`}>
                          {getScoreLabel(score.score)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => setShowSmartSuggestions(false)}
                  className="mt-2 text-xs text-gray-500 hover:text-gray-700"
                >
                  Önerileri gizle
                </button>
              </div>
            )}

            {!loadingScores && staffScores.length === 0 && formData.serviceId && formData.date && formData.time && (
              <div className="mt-3 flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
                <AlertCircle className="w-4 h-4" />
                Bu zaman diliminde müsait personel bulunamadı.
              </div>
            )}

            {!showSmartSuggestions && staffScores.length > 0 && (
              <button
                type="button"
                onClick={() => setShowSmartSuggestions(true)}
                className="mt-2 flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Sparkles className="w-4 h-4" />
                AI personel önerilerini göster
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Saat</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={createBooking.isPending}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {createBooking.isPending ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
        </button>
      </form>
    </div>
  )
}
