'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Upload, Palette } from 'lucide-react'

interface ThemeSettings {
  primaryColor: string
  logoUrl: string
  coverImage: string
}

export default function ThemeSettingsPage() {
  const [settings, setSettings] = useState<ThemeSettings>({
    primaryColor: '#4f46e5',
    logoUrl: '',
    coverImage: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings/theme')
      const data = await res.json()
      if (data) {
        setSettings({ ...settings, ...data })
      }
    } catch (error) {
      console.error('Error fetching theme:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/theme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (error) {
      console.error('Error saving theme:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const colors = [
    '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
  ]

  if (loading) return <div className="text-center py-20">Yükleniyor...</div>

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Tema Özelleştirme</h1>
        {saved && <span className="text-green-600 font-medium">Kaydedildi!</span>}
      </div>

      {/* Logo */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Logo
        </h2>
        
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <Palette className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              className="hidden"
            />
            <button
              onClick={() => logoInputRef.current?.click()}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Logo Yükle
            </button>
            <p className="text-xs text-gray-500 mt-2">PNG, JPG. Max 2MB</p>
          </div>
        </div>
      </div>

      {/* Renk */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ana Renk</h2>
        
        <div className="flex flex-wrap gap-3 mb-4">
          {colors.map(color => (
            <button
              key={color}
              onClick={() => setSettings({ ...settings, primaryColor: color })}
              className={`w-10 h-10 rounded-full transition-transform ${
                settings.primaryColor === color ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={settings.primaryColor}
            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={settings.primaryColor}
            onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: settings.primaryColor + '20' }}>
          <p className="text-sm" style={{ color: settings.primaryColor }}>
            Önizleme: Bu renk butonlarda ve bağlantılarda kullanılacak
          </p>
          <button
            className="mt-2 px-4 py-2 rounded-lg text-white text-sm"
            style={{ backgroundColor: settings.primaryColor }}
          >
            Örnek Buton
          </button>
        </div>
      </div>

      {/* Önizleme */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Canlı Önizleme</h2>
        
        <div 
          className="rounded-lg p-6 border"
          style={{ borderColor: settings.primaryColor }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: settings.primaryColor }}
            >
              {settings.logoUrl ? 'Logo' : 'R'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">İşletme Adı</h3>
              <p className="text-sm text-gray-500">Randevu sayfası önizlemesi</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-8 rounded" style={{ backgroundColor: settings.primaryColor + '20' }}></div>
            <div className="h-8 rounded" style={{ backgroundColor: settings.primaryColor + '20' }}></div>
            <div className="h-8 rounded" style={{ backgroundColor: settings.primaryColor + '20' }}></div>
          </div>
        </div>
      </div>

      <button
        onClick={saveSettings}
        disabled={saving}
        className="w-full py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        <Save className="w-5 h-5" />
        {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
      </button>
    </div>
  )
}
