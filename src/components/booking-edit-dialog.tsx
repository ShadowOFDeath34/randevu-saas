'use client'

/* eslint-disable react-hooks/set-state-in-effect */

import { useState, useEffect, useRef } from 'react'
import { useServices } from '@/hooks/use-services'
import { useStaff } from '@/hooks/use-staff'
import { useUpdateBooking } from '@/hooks/use-bookings'
import { Skeleton } from '@/components/ui/skeleton'
import { BookingStatus } from '@prisma/client'

interface Booking {
  id: string
  bookingDate: string
  startTime: string
  endTime: string
  status: string
  notes: string | null
  service: { id: string; name: string; durationMinutes: number }
  customer: { id: string; fullName: string; phone: string }
  staff: { id: string; fullName: string }
}

interface BookingEditDialogProps {
  booking: Booking | null
  isOpen: boolean
  onClose: () => void
}

export function BookingEditDialog({ booking, isOpen, onClose }: BookingEditDialogProps) {
  const { data: services = [], isLoading: servicesLoading } = useServices()
  const { data: staff = [], isLoading: staffLoading } = useStaff()
  const updateMutation = useUpdateBooking()

  const [formData, setFormData] = useState({
    serviceId: '',
    staffId: '',
    bookingDate: '',
    startTime: '',
    notes: '',
    status: 'pending' as BookingStatus
  })
  const [error, setError] = useState('')
  const initializedRef = useRef(false)

  // Booking değiştiğinde form'u doldur
  useEffect(() => {
    if (booking && !initializedRef.current) {
      initializedRef.current = true
      // Form state'i booking verisinden türet
      const initialFormData = {
        serviceId: booking.service.id,
        staffId: booking.staff.id,
        bookingDate: booking.bookingDate,
        startTime: booking.startTime,
        notes: booking.notes || '',
        status: booking.status as BookingStatus
      }
      setFormData(initialFormData)
      setError('')
    }
    if (!booking) {
      initializedRef.current = false
    }
  }, [booking])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!booking) return

    try {
      await updateMutation.mutateAsync({
        id: booking.id,
        data: {
          serviceId: formData.serviceId,
          staffId: formData.staffId,
          bookingDate: formData.bookingDate,
          startTime: formData.startTime,
          notes: formData.notes,
          status: formData.status
        }
      })
      onClose()
    } catch (err: unknown) {
      const error = err as Error
      setError(error.message || 'Randevu güncellenirken bir hata oluştu')
    }
  }

  if (!isOpen || !booking) return null

  const isLoading = servicesLoading || staffLoading

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">Randevu Düzenle</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {booking.customer.fullName} - {booking.customer.phone}
          </p>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hizmet
                </label>
                <select
                  value={formData.serviceId}
                  onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {services.map((s: { id: string; name: string; durationMinutes?: number }) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.durationMinutes} dk)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Personel
                </label>
                <select
                  value={formData.staffId}
                  onChange={(e) => setFormData({ ...formData, staffId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  {staff.map((s: { id: string; name: string }) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tarih
                </label>
                <input
                  type="date"
                  value={formData.bookingDate}
                  onChange={(e) => setFormData({ ...formData, bookingDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saat
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Durum
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as BookingStatus })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="pending">Bekliyor</option>
                <option value="confirmed">Onaylandı</option>
                <option value="completed">Tamamlandı</option>
                <option value="cancelled">İptal</option>
                <option value="no_show">Gelmedi</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notlar
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                placeholder="Randevu ile ilgili notlar..."
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                İptal
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
