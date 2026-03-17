'use client'

import { useState } from 'react'
import { Save, Mail, MessageSquare, Phone, Bell } from 'lucide-react'
import { useNotificationSettings, useUpdateNotificationSettings } from '@/hooks/use-settings'
import { Skeleton } from '@/components/ui/skeleton'

interface NotificationSettings {
  emailEnabled: boolean
  smsEnabled: boolean
  whatsappEnabled: boolean
  reminderHours: number[]
  bookingConfirmation: boolean
  bookingReminder: boolean
  bookingCancellation: boolean
  reviewRequest: boolean
}

export default function NotificationSettingsPage() {
  const { data: settings, isLoading } = useNotificationSettings()
  const updateSettings = useUpdateNotificationSettings()

  const [localSettings, setLocalSettings] = useState<NotificationSettings>({
    emailEnabled: true,
    smsEnabled: false,
    whatsappEnabled: false,
    reminderHours: [24, 2],
    bookingConfirmation: true,
    bookingReminder: true,
    bookingCancellation: true,
    reviewRequest: true
  })
  const [saved, setSaved] = useState(false)

  // Sync with loaded settings
  useState(() => {
    if (settings) {
      setLocalSettings(prev => ({ ...prev, ...settings }))
    }
  })

  const saveSettings = async () => {
    await updateSettings.mutateAsync(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const toggleReminderHour = (hour: number) => {
    setLocalSettings(prev => ({
      ...prev,
      reminderHours: prev.reminderHours.includes(hour)
        ? prev.reminderHours.filter(h => h !== hour)
        : [...prev.reminderHours, hour].sort((a, b) => b - a)
    }))
  }

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Bildirim Ayarları</h1>
        {saved && <span className="text-green-600 font-medium">Kaydedildi!</span>}
      </div>

      {/* Bildirim Kanalları */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Bildirim Kanalları
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">E-posta Bildirimleri</p>
                <p className="text-sm text-gray-500">Randevu onayı, hatırlatma ve yorum istekleri</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.emailEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, emailEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">WhatsApp Bildirimleri</p>
                <p className="text-sm text-gray-500">SMS yerine WhatsApp üzerinden bildirim</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.whatsappEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, whatsappEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-900">SMS Bildirimleri</p>
                <p className="text-sm text-gray-500">Kısa mesaj ile bildirim (ek ücretli)</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={localSettings.smsEnabled}
              onChange={(e) => setLocalSettings({ ...localSettings, smsEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
          </label>
        </div>
      </div>

      {/* Hatırlatma Zamanları */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Otomatik Hatırlatmalar</h2>
        <p className="text-sm text-gray-500 mb-4">Müşterilere randevudan önce otomatik hatırlatma gönderilecek saatler:</p>

        <div className="flex flex-wrap gap-2">
          {[48, 24, 12, 6, 2, 1].map(hour => (
            <button
              key={hour}
              onClick={() => toggleReminderHour(hour)}
              className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                localSettings.reminderHours.includes(hour)
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-600'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'
              }`}
            >
              {hour} saat önce
            </button>
          ))}
        </div>
      </div>

      {/* Bildirim Türleri */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Bildirim Türleri</h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Randevu Onayı</p>
              <p className="text-sm text-gray-500">Müşteri randevu oluşturduğunda onay bildirimi</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.bookingConfirmation}
              onChange={(e) => setLocalSettings({ ...localSettings, bookingConfirmation: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Randevu Hatırlatması</p>
              <p className="text-sm text-gray-500">Randevu öncesi otomatik hatırlatma</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.bookingReminder}
              onChange={(e) => setLocalSettings({ ...localSettings, bookingReminder: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">İptal Bildirimi</p>
              <p className="text-sm text-gray-500">Randevu iptal edildiğinde bildirim</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.bookingCancellation}
              onChange={(e) => setLocalSettings({ ...localSettings, bookingCancellation: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">Yorum İsteği</p>
              <p className="text-sm text-gray-500">Randevu tamamlandıktan sonra yorum isteği</p>
            </div>
            <input
              type="checkbox"
              checked={localSettings.reviewRequest}
              onChange={(e) => setLocalSettings({ ...localSettings, reviewRequest: e.target.checked })}
              className="w-5 h-5 rounded text-indigo-600"
            />
          </label>
        </div>
      </div>

      <button
        onClick={saveSettings}
        disabled={updateSettings.isPending}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {updateSettings.isPending ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
      </button>
    </div>
  )
}
