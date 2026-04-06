'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Key, Trash2, Copy, Check, Eye, EyeOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ApiKey {
  id: string
  name: string
  description: string | null
  keyPrefix: string
  status: 'ACTIVE' | 'REVOKED' | 'EXPIRED'
  expiresAt: string | null
  lastUsedAt: string | null
  rateLimitPerDay: number
  usageCountTotal: number
  permissions: string
  createdAt: string
}

const availablePermissions = [
  { key: 'bookings:read', label: 'Randevuları Görüntüle', category: 'Randevular' },
  { key: 'bookings:create', label: 'Randevu Oluştur', category: 'Randevular' },
  { key: 'bookings:update', label: 'Randevu Güncelle', category: 'Randevular' },
  { key: 'bookings:delete', label: 'Randevu Sil', category: 'Randevular' },
  { key: 'customers:read', label: 'Müşterileri Görüntüle', category: 'Müşteriler' },
  { key: 'customers:manage', label: 'Müşterileri Yönet', category: 'Müşteriler' },
  { key: 'staff:read', label: 'Personeli Görüntüle', category: 'Personel' },
  { key: 'staff:manage', label: 'Personeli Yönet', category: 'Personel' },
  { key: 'services:read', label: 'Hizmetleri Görüntüle', category: 'Hizmetler' },
  { key: 'services:manage', label: 'Hizmetleri Yönet', category: 'Hizmetler' },
  { key: 'analytics:read', label: 'Analitik Görüntüle', category: 'Analitik' },
  { key: 'webhooks:manage', label: 'Webhook Yönet', category: 'Gelişmiş' }
]

export default function ApiKeysPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [showNewKey, setShowNewKey] = useState(false)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
    rateLimitPerDay: 10000,
    expiresAt: ''
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/settings/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data.keys)
      }
    } catch (error) {
      console.error('Error fetching API keys:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setNewKey(data.apiKey.key)
        setShowNewKey(false)
        toast({
          title: 'API Anahtarı oluşturuldu',
          description: 'Anahtarınızı güvenli bir yerde saklayın, bir daha gösterilmeyecek.'
        })
        fetchApiKeys()
      }
    } catch {
      toast({
        title: 'Hata',
        description: 'API anahtarı oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleRevoke = async (key: ApiKey) => {
    if (!confirm(`"${key.name}" anahtarını iptal etmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`)) return

    try {
      const response = await fetch(`/api/settings/api-keys/${key.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Anahtar iptal edildi',
          description: `${key.name} anahtarı başarıyla iptal edildi.`
        })
        fetchApiKeys()
      }
    } catch {
      toast({
        title: 'Hata',
        description: 'Anahtar iptal edilirken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast({ title: 'Kopyalandı', description: 'API anahtarı panoya kopyalandı.' })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      permissions: [],
      rateLimitPerDay: 10000,
      expiresAt: ''
    })
    setNewKey(null)
    setShowNewKey(false)
  }

  const togglePermission = (permissionKey: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Aktif</Badge>
      case 'REVOKED':
        return <Badge variant="destructive">İptal Edildi</Badge>
      case 'EXPIRED':
        return <Badge variant="secondary">Süresi Doldu</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
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
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">API Anahtarları</h1>
          <p className="text-muted-foreground">
            Harici uygulamalar için API erişim anahtarlarını yönetin.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={(open) => {
          setIsCreateOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni API Anahtarı
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni API Anahtarı Oluştur</DialogTitle>
            </DialogHeader>
            {newKey ? (
              <div className="space-y-4 py-4">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                  <strong>Önemli:</strong> Bu anahtarı şimdi kopyalayın! Güvenlik nedeniyle bir daha gösterilmeyecektir.
                </div>
                <div className="space-y-2">
                  <Label>API Anahtarınız</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Input
                        type={showNewKey ? 'text' : 'password'}
                        value={newKey}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2"
                        onClick={() => setShowNewKey(!showNewKey)}
                      >
                        {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(newKey)}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button onClick={() => {
                    setIsCreateOpen(false)
                    resetForm()
                  }}>
                    Tamam
                  </Button>
                </div>
              </div>
            ) : (
              <KeyForm />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Kullanımı
          </CardTitle>
          <CardDescription>
            API anahtarlarınızı HTTP isteklerinizin Authorization header&apos;ında Bearer token olarak kullanın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <code className="block bg-muted p-3 rounded-lg text-sm font-mono">
            Authorization: Bearer &lt;your-api-key&gt;
          </code>
        </CardContent>
      </Card>

      {/* API Keys List */}
      <div className="space-y-4">
        {apiKeys.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz API anahtarı oluşturulmamış.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                İlk Anahtarınızı Oluşturun
              </Button>
            </CardContent>
          </Card>
        ) : (
          apiKeys.map((key) => (
            <Card key={key.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Key className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{key.name}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">
                        {key.keyPrefix}... • Oluşturuldu: {new Date(key.createdAt).toLocaleDateString('tr-TR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(key.status)}
                    {key.status === 'ACTIVE' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleRevoke(key)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              {key.description && (
                <CardContent className="pt-0">
                  <p className="text-sm text-muted-foreground">{key.description}</p>
                </CardContent>
              )}
              <CardContent className="pt-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Günlük Limit</p>
                    <p className="font-medium">{key.rateLimitPerDay.toLocaleString('tr-TR')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Toplam Kullanım</p>
                    <p className="font-medium">{key.usageCountTotal.toLocaleString('tr-TR')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Son Kullanım</p>
                    <p className="font-medium">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString('tr-TR') : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Bitiş Tarihi</p>
                    <p className="font-medium">
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString('tr-TR') : 'Sınırsız'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-2">İzinler:</p>
                  <div className="flex flex-wrap gap-1">
                    {JSON.parse(key.permissions || '[]').map((perm: string) => (
                      <Badge key={perm} variant="secondary" className="text-xs">
                        {availablePermissions.find(p => p.key === perm)?.label || perm}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )

  function KeyForm() {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Anahtar Adı</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Mobil Uygulama, Entegrasyon"
          />
        </div>

        <div className="space-y-2">
          <Label>Açıklama</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Bu anahtarın kullanım amacı..."
          />
        </div>

        <div className="space-y-2">
          <Label>Günlük İstek Limiti</Label>
          <Input
            type="number"
            value={formData.rateLimitPerDay}
            onChange={(e) => setFormData({ ...formData, rateLimitPerDay: parseInt(e.target.value) || 10000 })}
          />
          <p className="text-xs text-muted-foreground">Günlük maksimum API isteği sayısı</p>
        </div>

        <div className="space-y-2">
          <Label>Bitiş Tarihi (İsteğe Bağlı)</Label>
          <Input
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
          />
        </div>

        <div className="space-y-4">
          <Label>İzinler</Label>
          <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
            {availablePermissions.map((perm) => (
              <div key={perm.key} className="flex items-center gap-2">
                <Checkbox
                  checked={formData.permissions.includes(perm.key)}
                  onCheckedChange={() => togglePermission(perm.key)}
                />
                <div className="flex flex-col">
                  <span className="text-sm">{perm.label}</span>
                  <span className="text-xs text-muted-foreground">{perm.category}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => {
            resetForm()
            setIsCreateOpen(false)
          }}>
            İptal
          </Button>
          <Button
            onClick={handleCreate}
            disabled={isSaving || !formData.name || formData.permissions.length === 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Anahtar Oluştur
          </Button>
        </div>
      </div>
    )
  }
}
