'use client'

import { useState, useEffect, useRef } from 'react'
import {
  useBusinessProfile,
  useBusinessHours,
  useUpdateBusinessProfile,
  useUpdateBusinessHours,
} from '@/hooks/use-settings'
import { Skeleton } from '@/components/ui/skeleton'

interface BusinessProfile {
  businessName: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  description: string | null
  bookingSlug: string
  bufferTimeMinutes?: number
  cancellationPolicyHours?: number
  allowOnlineBooking?: boolean
  maxAdvanceBookingDays?: number
  minAdvanceBookingHours?: number
}

interface BusinessHours {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

export default function SettingsPage() {
  const { data: profile, isLoading: profileLoading } = useBusinessProfile()
  const { data: hours = [], isLoading: hoursLoading } = useBusinessHours()
  const updateProfile = useUpdateBusinessProfile()
  const updateHours = useUpdateBusinessHours()

  const [saved, setSaved] = useState(false)
  const [profileForm, setProfileForm] = useState({
    businessName: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    district: '',
    description: ''
  })
  const [bookingSettings, setBookingSettings] = useState({
    bufferTimeMinutes: 0,
    cancellationPolicyHours: 24,
    allowOnlineBooking: true,
    maxAdvanceBookingDays: 30,
    minAdvanceBookingHours: 1
  })
  const [localHours, setLocalHours] = useState<BusinessHours[]>([])
  const profileInitialized = useRef(false)
  const hoursInitialized = useRef(false)

  // Initialize profile form when data loads - using ref to prevent cascading renders
  useEffect(() => {
    if (profile && !profileInitialized.current) {
      profileInitialized.current = true
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setProfileForm({
          businessName: profile.businessName || '',
          phone: profile.phone || '',
          email: profile.email || '',
          address: profile.address || '',
          city: profile.city || '',
          district: profile.district || '',
          description: profile.description || ''
        })
        setBookingSettings({
          bufferTimeMinutes: profile.bufferTimeMinutes ?? 0,
          cancellationPolicyHours: profile.cancellationPolicyHours ?? 24,
          allowOnlineBooking: profile.allowOnlineBooking ?? true,
          maxAdvanceBookingDays: profile.maxAdvanceBookingDays ?? 30,
          minAdvanceBookingHours: profile.minAdvanceBookingHours ?? 1
        })
      }, 0)
    }
  }, [profile])

  // Initialize hours when data loads - using ref to prevent cascading renders
  useEffect(() => {
    if (hours.length > 0 && !hoursInitialized.current) {
      hoursInitialized.current = true
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setLocalHours(hours)
      }, 0)
    }
  }, [hours])

  const saveProfile = async () => {
    await updateProfile.mutateAsync(profileForm)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const updateHourField = (dayOfWeek: number, field: string, value: string | boolean | null) => {
    setLocalHours(prev => prev.map(h =>
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    ))
  }

  const saveHours = async () => {
    await updateHours.mutateAsync(localHours)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  if (profileLoading || hoursLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="grid gap-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Ayarlar</h1>
        {saved && (
          <span className="text-green-600 font-medium">Kaydedildi!</span>
        )}
      </div>

      {/* İşletme Profili */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">İşletme Bilgileri</h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">İşletme Adı</label>
            <input
              type="text"
              value={profileForm.businessName}
              onChange={(e) => setProfileForm({ ...profileForm, businessName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-posta</label>
              <input
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Adres</label>
            <textarea
              value={profileForm.address}
              onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Şehir</label>
              <input
                type="text"
                value={profileForm.city}
                onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">İlçe</label>
              <input
                type="text"
                value={profileForm.district}
                onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama</label>
            <textarea
              value={profileForm.description}
              onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="İşletmeniz hakkında kısa bir açıklama..."
            />
          </div>

          {profile?.bookingSlug && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <label className="block text-sm font-medium text-gray-700 mb-1">Randevu Sayfası</label>
              <a
                href={`/b/${profile.bookingSlug}`}
                target="_blank"
                className="text-indigo-600 hover:underline"
              >
                {typeof window !== 'undefined' ? window.location.origin : ''}/b/{profile.bookingSlug}
              </a>
            </div>
          )}

          <button
            onClick={saveProfile}
            disabled={updateProfile.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Çalışma Saatleri */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Çalışma Saatleri</h2>

        <div className="space-y-3">
          {localHours.map((hour) => (
            <div key={hour.dayOfWeek} className="flex items-center gap-4">
              <div className="w-28 font-medium text-gray-700">
                {dayNames[hour.dayOfWeek]}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hour.isClosed}
                  onChange={(e) => updateHourField(hour.dayOfWeek, 'isClosed', !e.target.checked)}
                  className="rounded border-gray-300"
                />

                {!hour.isClosed && (
                  <>
                    <input
                      type="time"
                      value={hour.openTime || '09:00'}
                      onChange={(e) => updateHourField(hour.dayOfWeek, 'openTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={hour.closeTime || '18:00'}
                      onChange={(e) => updateHourField(hour.dayOfWeek, 'closeTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                    />
                  </>
                )}

                {hour.isClosed && (
                  <span className="text-gray-500">Kapalı</span>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={saveHours}
          disabled={updateHours.isPending}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {updateHours.isPending ? 'Kaydediliyor...' : 'Çalışma Saatlerini Kaydet'}
        </button>
      </div>

      {/* Randevu Ayarları */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Randevu Ayarları</h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Randevular Arası Hazırlık Süresi (dakika)
              </label>
              <input
                type="number"
                min={0}
                max={60}
                value={bookingSettings.bufferTimeMinutes}
                onChange={(e) => setBookingSettings({ ...bookingSettings, bufferTimeMinutes: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Personelin randevular arası hazırlık yapması için gereken süre</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                İptal Politikası (saat önceden)
              </label>
              <input
                type="number"
                min={0}
                max={72}
                value={bookingSettings.cancellationPolicyHours}
                onChange={(e) => setBookingSettings({ ...bookingSettings, cancellationPolicyHours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Müşterilerin randevuyu iptal edebilmeleri için minimum kaç saat önceden bildirmeleri gerekir</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Maksimum İleri Tarih (gün)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={bookingSettings.maxAdvanceBookingDays}
                onChange={(e) => setBookingSettings({ ...bookingSettings, maxAdvanceBookingDays: parseInt(e.target.value) || 30 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Müşteriler en fazla kaç gün sonrasına randevu alabilir</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Minimum Önceden Bildirim (saat)
              </label>
              <input
                type="number"
                min={0}
                max={48}
                value={bookingSettings.minAdvanceBookingHours}
                onChange={(e) => setBookingSettings({ ...bookingSettings, minAdvanceBookingHours: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              <p className="text-xs text-gray-500 mt-1">Müşteriler en az kaç saat önceden randevu alabilir</p>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="allowOnlineBooking"
              checked={bookingSettings.allowOnlineBooking}
              onChange={(e) => setBookingSettings({ ...bookingSettings, allowOnlineBooking: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="allowOnlineBooking" className="text-sm text-gray-700">
              Online randevu alımına açık
            </label>
          </div>

          <button
            onClick={async () => {
              await updateProfile.mutateAsync({ ...profileForm, ...bookingSettings })
              setSaved(true)
              setTimeout(() => setSaved(false), 3000)
            }}
            disabled={updateProfile.isPending}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {updateProfile.isPending ? 'Kaydediliyor...' : 'Randevu Ayarlarını Kaydet'}
          </button>
        </div>
      </div>
    </div>
  )
}
