'use client'

import { useState, useEffect } from 'react'

interface BusinessProfile {
  businessName: string
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  district: string | null
  description: string | null
  bookingSlug: string
}

interface BusinessHours {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [hours, setHours] = useState<BusinessHours[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const [profileRes, hoursRes] = await Promise.all([
        fetch('/api/settings/profile'),
        fetch('/api/settings/hours')
      ])
      
      const profileData = await profileRes.json()
      const hoursData = await hoursRes.json()
      
      setProfile(profileData)
      setHours(hoursData)
      
      if (profileData) {
        setProfileForm({
          businessName: profileData.businessName || '',
          phone: profileData.phone || '',
          email: profileData.email || '',
          address: profileData.address || '',
          city: profileData.city || '',
          district: profileData.district || '',
          description: profileData.description || ''
        })
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
    } finally {
      setSaving(false)
    }
  }

  const updateHours = async (dayOfWeek: number, field: string, value: any) => {
    const newHours = hours.map(h => 
      h.dayOfWeek === dayOfWeek ? { ...h, [field]: value } : h
    )
    setHours(newHours)
  }

  const saveHours = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/hours', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hours)
      })
      
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving hours:', error)
    } finally {
      setSaving(false)
    }
  }

  const dayNames = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi']

  if (loading) return <div className="text-center py-10">Yükleniyor...</div>

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
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </button>
        </div>
      </div>

      {/* Çalışma Saatleri */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Çalışma Saatleri</h2>
        
        <div className="space-y-3">
          {hours.map((hour) => (
            <div key={hour.dayOfWeek} className="flex items-center gap-4">
              <div className="w-28 font-medium text-gray-700">
                {dayNames[hour.dayOfWeek]}
              </div>
              
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!hour.isClosed}
                  onChange={(e) => updateHours(hour.dayOfWeek, 'isClosed', !e.target.checked)}
                  className="rounded border-gray-300"
                />
                
                {!hour.isClosed && (
                  <>
                    <input
                      type="time"
                      value={hour.openTime || '09:00'}
                      onChange={(e) => updateHours(hour.dayOfWeek, 'openTime', e.target.value)}
                      className="px-2 py-1 border border-gray-300 rounded"
                    />
                    <span className="text-gray-500">-</span>
                    <input
                      type="time"
                      value={hour.closeTime || '18:00'}
                      onChange={(e) => updateHours(hour.dayOfWeek, 'closeTime', e.target.value)}
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
          disabled={saving}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Kaydediliyor...' : 'Çalışma Saatlerini Kaydet'}
        </button>
      </div>
    </div>
  )
}
