'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import { Building2, Mail, Phone, MapPin, Globe } from 'lucide-react'

interface BusinessProfile {
  id: string
  businessName: string
  email: string
  phone: string
  address: string
  city: string
  district: string
  description: string
}

export default function ProfileSettingsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/settings/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.profile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return

    setSaving(true)
    try {
      const response = await fetch('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      })

      if (response.ok) {
        toast({
          title: 'Başarılı',
          description: 'İşletme profili güncellendi'
        })
      } else {
        throw new Error('Update failed')
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Profil güncellenirken bir hata oluştu',
        variant: 'destructive'
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            Profil bilgileri yüklenemedi
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">İşletme Profili</h1>
        <p className="text-muted-foreground">
          İşletme bilgilerinizi düzenleyin
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Temel Bilgiler
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="businessName" className="text-sm font-medium">İşletme Adı</label>
                <Input
                  id="businessName"
                  value={profile.businessName}
                  onChange={(e) => setProfile({ ...profile, businessName: e.target.value })}
                  required
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
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="address" className="text-sm font-medium">Adres</label>
              <Input
                id="address"
                value={profile.address || ''}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="description" className="text-sm font-medium">Açıklama</label>
              <textarea
                id="description"
                className="w-full min-h-[100px] p-3 rounded-md border border-input bg-background"
                value={profile.description || ''}
                onChange={(e) => setProfile({ ...profile, description: e.target.value })}
                placeholder="İşletmeniz hakkında kısa bir açıklama..."
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={saving}>
            {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  )
}
