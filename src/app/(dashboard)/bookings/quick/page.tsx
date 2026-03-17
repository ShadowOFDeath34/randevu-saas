'use client'

import { useState, useEffect } from 'react'
import { formatDate, addMinutesToTime } from '@/lib/utils'

interface Service {
  id: string
  name: string
  durationMinutes: number
  price: number | null
}

interface Staff {
  id: string
  fullName: string
}

interface Customer {
  id: string
  fullName: string
  phone: string
}

export default function QuickBookingPage() {
  const [services, setServices] = useState<Service[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState({
    customerId: '',
    customerName: '',
    customerPhone: '',
    serviceId: '',
    staffId: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00'
  })

  const [existingCustomer, setExistingCustomer] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [servicesRes, staffRes, customersRes] = await Promise.all([
        fetch('/api/services'),
        fetch('/api/staff'),
        fetch('/api/customers')
      ])

      const [servicesData, staffData, customersData] = await Promise.all([
        servicesRes.json(),
        staffRes.json(),
        customersRes.json()
      ])

      setServices(servicesData)
      setStaff(staffData)
      setCustomers(customersData)

      if (servicesData.length > 0) {
        setFormData(prev => ({ ...prev, serviceId: servicesData[0].id }))
      }
      if (staffData.length > 0) {
        setFormData(prev => ({ ...prev, staffId: staffData[0].id }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCustomerChange = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerId,
        customerName: customer.fullName,
        customerPhone: customer.phone
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const service = services.find(s => s.id === formData.serviceId)
      const endTime = addMinutesToTime(formData.time, service?.durationMinutes || 30)

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: existingCustomer ? formData.customerId : undefined,
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          serviceId: formData.serviceId,
          staffId: formData.staffId,
          bookingDate: formData.date,
          startTime: formData.time,
          endTime
        })
      })

      if (res.ok) {
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
    } catch (error) {
      console.error('Error creating booking:', error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="text-center py-20">Yükleniyor...</div>

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
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.fullName} - {c.phone}</option>
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
              {services.map(s => (
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
              {staff.map(s => (
                <option key={s.id} value={s.id}>{s.fullName}</option>
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
          disabled={saving}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Oluşturuluyor...' : 'Randevu Oluştur'}
        </button>
      </form>
    </div>
  )
}
