'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Upload, Globe, Palette, Mail } from 'lucide-react'

interface BrandingConfig {
  primaryColor: string
  secondaryColor: string
  accentColor: string
  backgroundColor: string
  textColor: string
  darkBackgroundColor: string
  darkTextColor: string
  fontFamily: string
  fontScale: string
  themeMode: string
  portalTitle: string
  portalSubtitle: string | null
  bookingPageTitle: string
  bookingPageDescription: string | null
  showPoweredBy: boolean
  showTenantName: boolean
  emailHeaderColor: string
  logoUrl: string | null
  faviconUrl: string | null
  customDomain: string | null
  domainVerified: boolean
}

export default function BrandingPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [config, setConfig] = useState<BrandingConfig>({
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
    accentColor: '#06b6d4',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    darkBackgroundColor: '#111827',
    darkTextColor: '#f3f4f6',
    fontFamily: 'Inter, system-ui, sans-serif',
    fontScale: '100%',
    themeMode: 'light',
    portalTitle: 'Randevu Portalı',
    portalSubtitle: null,
    bookingPageTitle: 'Randevu Al',
    bookingPageDescription: null,
    showPoweredBy: true,
    showTenantName: true,
    emailHeaderColor: '#4f46e5',
    logoUrl: null,
    faviconUrl: null,
    customDomain: null,
    domainVerified: false
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const response = await fetch('/api/settings/branding')
      if (response.ok) {
        const data = await response.json()
        setConfig(prev => ({ ...prev, ...data }))
      }
    } catch (error) {
      console.error('Error fetching branding:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/branding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast({
          title: 'Ayarlar kaydedildi',
          description: 'Marka özelleştirmeleriniz güncellendi.'
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Ayarlar kaydedilirken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    try {
      const response = await fetch('/api/settings/branding/upload', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setConfig(prev => ({
          ...prev,
          [type === 'logo' ? 'logoUrl' : type === 'favicon' ? 'faviconUrl' : 'logoUrl']: data.url
        }))
        toast({
          title: 'Yüklendi',
          description: 'Dosya başarıyla yüklendi.'
        })
      }
    } catch (error) {
      toast({
        title: 'Hata',
        description: 'Dosya yüklenirken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Marka ve Tema</h1>
        <p className="text-muted-foreground">
          İşletmenizin marka kimliğini özelleştirin ve portal görünümünü ayarlayın.
        </p>
      </div>

      <Tabs defaultValue="colors" className="space-y-6">
        <TabsList className="grid grid-cols-4 w-full max-w-md">
          <TabsTrigger value="colors">
            <Palette className="h-4 w-4 mr-2" />
            Renkler
          </TabsTrigger>
          <TabsTrigger value="content">
            <Globe className="h-4 w-4 mr-2" />
            İçerik
          </TabsTrigger>
          <TabsTrigger value="email">
            <Mail className="h-4 w-4 mr-2" />
            E-posta
          </TabsTrigger>
          <TabsTrigger value="domain">
            <Globe className="h-4 w-4 mr-2" />
            Domain
          </TabsTrigger>
        </TabsList>

        <TabsContent value="colors">
          <Card>
            <CardHeader>
              <CardTitle>Renk ve Tema</CardTitle>
              <CardDescription>
                Portalınızın renk şemasını ve görünümünü özelleştirin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo</Label>
                <div className="flex items-center gap-4">
                  {config.logoUrl && (
                    <img src={config.logoUrl} alt="Logo" className="h-16 w-auto object-contain" />
                  )}
                  <Label className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      <span>Logo Yükle</span>
                    </div>
                    <Input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, 'logo')}
                    />
                  </Label>
                </div>
              </div>

              {/* Color Picker Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Ana Renk</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="w-12 h-10 p-0 border-0"
                    />
                    <Input
                      value={config.primaryColor}
                      onChange={(e) => setConfig({ ...config, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>İkincil Renk</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="w-12 h-10 p-0 border-0"
                    />
                    <Input
                      value={config.secondaryColor}
                      onChange={(e) => setConfig({ ...config, secondaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Vurgu Rengi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="w-12 h-10 p-0 border-0"
                    />
                    <Input
                      value={config.accentColor}
                      onChange={(e) => setConfig({ ...config, accentColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Arka Plan Rengi</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="color"
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="w-12 h-10 p-0 border-0"
                    />
                    <Input
                      value={config.backgroundColor}
                      onChange={(e) => setConfig({ ...config, backgroundColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              {/* Theme Mode */}
              <div className="space-y-2">
                <Label>Tema Modu</Label>
                <select
                  value={config.themeMode}
                  onChange={(e) => setConfig({ ...config, themeMode: e.target.value })}
                  className="w-full border rounded-lg px-3 py-2"
                >
                  <option value="light">Aydınlık</option>
                  <option value="dark">Karanlık</option>
                  <option value="auto">Otomatik (Sistem)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content">
          <Card>
            <CardHeader>
              <CardTitle>İçerik Ayarları</CardTitle>
              <CardDescription>
                Portal sayfalarınızın başlık ve açıklamalarını düzenleyin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Portal Başlığı</Label>
                <Input
                  value={config.portalTitle}
                  onChange={(e) => setConfig({ ...config, portalTitle: e.target.value })}
                  placeholder="Randevu Portalı"
                />
              </div>
              <div className="space-y-2">
                <Label>Portal Alt Başlığı</Label>
                <Input
                  value={config.portalSubtitle || ''}
                  onChange={(e) => setConfig({ ...config, portalSubtitle: e.target.value })}
                  placeholder="Online randevu sistemi"
                />
              </div>
              <div className="space-y-2">
                <Label>Randevu Sayfa Başlığı</Label>
                <Input
                  value={config.bookingPageTitle}
                  onChange={(e) => setConfig({ ...config, bookingPageTitle: e.target.value })}
                  placeholder="Randevu Al"
                />
              </div>
              <div className="flex items-center gap-4 pt-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.showPoweredBy}
                    onCheckedChange={(checked) => setConfig({ ...config, showPoweredBy: checked })}
                  />
                  <Label>Powered by göster</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={config.showTenantName}
                    onCheckedChange={(checked) => setConfig({ ...config, showTenantName: checked })}
                  />
                  <Label>İşletme adını göster</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle>E-posta Şablonları</CardTitle>
              <CardDescription>
                Gönderilen e-postaların görünümünü özelleştirin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>E-posta Başlık Rengi</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="color"
                    value={config.emailHeaderColor}
                    onChange={(e) => setConfig({ ...config, emailHeaderColor: e.target.value })}
                    className="w-12 h-10 p-0 border-0"
                  />
                  <Input
                    value={config.emailHeaderColor}
                    onChange={(e) => setConfig({ ...config, emailHeaderColor: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="domain">
          <Card>
            <CardHeader>
              <CardTitle>Özel Domain</CardTitle>
              <CardDescription>
                Portalınızı kendi domain adresiniz üzerinde çalıştırın.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Custom Domain</Label>
                <div className="flex gap-2">
                  <Input
                    value={config.customDomain || ''}
                    onChange={(e) => setConfig({ ...config, customDomain: e.target.value })}
                    placeholder="ornek.com"
                  />
                  <Button variant="outline">Doğrula</Button>
                </div>
                {config.customDomain && !config.domainVerified && (
                  <p className="text-sm text-amber-600">
                    Domain doğrulanmamış. DNS ayarlarını kontrol edin.
                  </p>
                )}
                {config.customDomain && config.domainVerified && (
                  <p className="text-sm text-green-600">Domain doğrulandı ✓</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={fetchConfig}>
          Sıfırla
        </Button>
        <Button onClick={saveConfig} disabled={isSaving}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Değişiklikleri Kaydet
        </Button>
      </div>
    </div>
  )
}
