'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Building2, Mail, Phone, MapPin, Loader2, Save, AlertCircle } from 'lucide-react'

interface BusinessProfile {
  id: string
  businessName: string
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  district: string | null
  description: string | null
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings/profile')
      if (!response.ok) throw new Error('Profil yüklenemedi')
      const data = await response.json()
      setProfile(data)
      setError(null)
    } catch (err) {
      setError('Profil bilgileri yüklenirken hata oluştu')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    setSuccess(false)
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (!response.ok) throw new Error('Kaydetme başarısız')

      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Kaydetme sırasında hata oluştu')
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-3xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="p-6 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-2">İşletme Profili</h1>
        <p className="text-muted-foreground mb-6">İşletme bilgilerinizi düzenleyin</p>
        <Card className="border-destructive">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mb-4" />
            <p className="text-destructive mb-4">{error || 'Profil yüklenemedi'}</p>
            <Button onClick={fetchProfile}>Tekrar Dene</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">İşletme Profili</h1>
        <p className="text-muted-foreground mt-1">İşletme bilgilerinizi düzenleyin</p>
      </div>

      {success && (
        <div className="mb-4 p-4 rounded-lg bg-green-50 text-green-600 border border-green-200">
          Profil başarıyla güncellendi!
        </div>
      )}

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-red-50 text-red-600 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Temel Bilgiler
            </CardTitle>
            <CardDescription>İşletmenizin temel iletişim bilgileri</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium">
                  İşletme Adı
                </label>
                <Input
                  id="businessName"
                  value={profile.businessName || ''}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  required
                  placeholder="Elya Güzellik Salonu"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  E-posta
                </label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="info@elya.com"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Telefon
                </label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+90 555 123 45 67"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="text-sm font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Şehir
                </label>
                <Input
                  id="city"
                  value={profile.city || ''}
                  onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                  placeholder="İstanbul"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">
                Adres
              </label>
              <Input
                id="address"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="Bağdat Caddesi No: 123, Kadıköy"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">
                Açıklama
              </label>
              <textarea
                id="description"
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                rows={4}
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="İşletmeniz hakkında kısa bir açıklama..."
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={saving} size="lg">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Kaydediliyor...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Değişiklikleri Kaydet
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
