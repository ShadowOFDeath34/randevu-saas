'use client'

import { useState, useEffect, useRef } from 'react'
import { useServices } from '@/hooks/use-services'
import { useStaff } from '@/hooks/use-staff'
import { useCustomers } from '@/hooks/use-customers'
import { useCreateBooking } from '@/hooks/use-bookings'
import { addMinutesToTime } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Service {
  id: string
  name: string
  duration: number
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

export default function QuickBookingPage() {
  const { data: services = [], isLoading: servicesLoading } = useServices()
  const { data: staff = [], isLoading: staffLoading } = useStaff()
  const { data: customersData, isLoading: customersLoading } = useCustomers()
  const createBooking = useCreateBooking()

  const customers = customersData?.customers || []

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const service = services.find((s: Service) => s.id === formData.serviceId)
    const endTime = addMinutesToTime(formData.time, service?.duration || 30)

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
              onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              required
            >
              {services.map((s: Service) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.duration} dk)
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
