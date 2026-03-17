'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, Upload, Palette } from 'lucide-react'
import { useThemeSettings, useUpdateThemeSettings } from '@/hooks/use-settings'
import { Skeleton } from '@/components/ui/skeleton'

interface ThemeSettings {
  primaryColor: string
  logoUrl: string
  coverImage: string
}

export default function ThemeSettingsPage() {
  const { data: settings, isLoading } = useThemeSettings()
  const updateSettings = useUpdateThemeSettings()

  const [localSettings, setLocalSettings] = useState<ThemeSettings>({
    primaryColor: '#4f46e5',
    logoUrl: '',
    coverImage: ''
  })
  const [saved, setSaved] = useState(false)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const settingsInitialized = useRef(false)

  // Initialize settings when data loads - using ref to prevent cascading renders
  useEffect(() => {
    if (settings && !settingsInitialized.current) {
      settingsInitialized.current = true
      // Use setTimeout to avoid synchronous setState in effect
      setTimeout(() => {
        setLocalSettings(settings)
      }, 0)
    }
  }, [settings])

  const saveSettings = async () => {
    await updateSettings.mutateAsync(localSettings)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setLocalSettings({ ...localSettings, logoUrl: reader.result as string })
      }
      reader.readAsDataURL(file)
    }
  }

  const colors = [
    '#4f46e5', '#7c3aed', '#db2777', '#dc2626',
    '#ea580c', '#ca8a04', '#16a34a', '#0891b2'
  ]

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex items-center gap-6">
            <Skeleton className="w-24 h-24 rounded-xl" />
            <Skeleton className="h-10 w-32" />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="flex flex-wrap gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-10 h-10 rounded-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

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
            {localSettings.logoUrl ? (
              <img src={localSettings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
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
              onClick={() => setLocalSettings({ ...localSettings, primaryColor: color })}
              className={`w-10 h-10 rounded-full transition-transform ${
                localSettings.primaryColor === color ? 'ring-2 ring-offset-2 ring-indigo-600 scale-110' : ''
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>

        <div className="flex items-center gap-3">
          <input
            type="color"
            value={localSettings.primaryColor}
            onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
            className="w-10 h-10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={localSettings.primaryColor}
            onChange={(e) => setLocalSettings({ ...localSettings, primaryColor: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div className="mt-6 p-4 rounded-lg" style={{ backgroundColor: localSettings.primaryColor + '20' }}>
          <p className="text-sm" style={{ color: localSettings.primaryColor }}>
            Önizleme: Bu renk butonlarda ve bağlantılarda kullanılacak
          </p>
          <button
            className="mt-2 px-4 py-2 rounded-lg text-white text-sm"
            style={{ backgroundColor: localSettings.primaryColor }}
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
          style={{ borderColor: localSettings.primaryColor }}
        >
          <div className="flex items-center gap-4 mb-4">
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: localSettings.primaryColor }}
            >
              {localSettings.logoUrl ? 'Logo' : 'R'}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">İşletme Adı</h3>
              <p className="text-sm text-gray-500">Randevu sayfası önizlemesi</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="h-8 rounded" style={{ backgroundColor: localSettings.primaryColor + '20' }}></div>
            <div className="h-8 rounded" style={{ backgroundColor: localSettings.primaryColor + '20' }}></div>
            <div className="h-8 rounded" style={{ backgroundColor: localSettings.primaryColor + '20' }}></div>
          </div>
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
