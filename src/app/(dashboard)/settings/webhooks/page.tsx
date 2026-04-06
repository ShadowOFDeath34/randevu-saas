'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Plus, Webhook, Trash2, Edit, Eye, X, RefreshCw, Clock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface WebhookDelivery {
  id: string
  eventType: string
  status: 'PENDING' | 'DELIVERED' | 'FAILED' | 'RETRYING'
  httpStatusCode: number | null
  responseBody: string | null
  errorMessage: string | null
  retryCount: number
  nextRetryAt: string | null
  createdAt: string
  completedAt: string | null
}

interface Webhook {
  id: string
  name: string
  url: string
  description: string | null
  events: string[]
  status: 'ACTIVE' | 'DISABLED' | 'PAUSED'
  secret: string
  maxRetries: number
  retryIntervalSec: number
  createdAt: string
  _count?: {
    deliveries: number
  }
  stats?: {
    success: number
    failed: number
    total: number
  }
  deliveries?: WebhookDelivery[]
}

interface WebhookEvent {
  key: string
  label: string
  category: string
}

export default function WebhooksPage() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [webhooks, setWebhooks] = useState<Webhook[]>([])
  const [availableEvents, setAvailableEvents] = useState<WebhookEvent[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDetailOpen, setIsDetailOpen] = useState(false)
  const [selectedWebhook, setSelectedWebhook] = useState<Webhook | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    url: '',
    description: '',
    events: [] as string[],
    maxRetries: 3,
    retryIntervalSec: 60
  })

  useEffect(() => {
    fetchWebhooks()
  }, [])

  const fetchWebhooks = async () => {
    try {
      const response = await fetch('/api/settings/webhooks')
      if (response.ok) {
        const data = await response.json()
        setWebhooks(data.webhooks)
        setAvailableEvents(data.availableEvents)
      }
    } catch {
      console.error('Error fetching webhooks')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchWebhookDetails = async (webhook: Webhook) => {
    try {
      const response = await fetch(`/api/settings/webhooks/${webhook.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedWebhook(data)
        setIsDetailOpen(true)
      }
    } catch {
      toast({
        title: 'Hata',
        description: 'Webhook detayları alınırken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  const handleCreate = async () => {
    setIsSaving(true)
    try {
      const response = await fetch('/api/settings/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: 'Webhook oluşturuldu',
          description: `${formData.name} webhook'u başarıyla oluşturuldu. Secret: ${data.secret.substring(0, 8)}...`
        })
        setIsCreateOpen(false)
        resetForm()
        fetchWebhooks()
      } else {
        const error = await response.json()
        toast({
          title: 'Hata',
          description: error.error || 'Webhook oluşturulurken bir hata oluştu.',
          variant: 'destructive'
        })
      }
    } catch {
      toast({
        title: 'Hata',
        description: 'Webhook oluşturulurken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async () => {
    if (!selectedWebhook) return
    setIsSaving(true)

    try {
      const response = await fetch(`/api/settings/webhooks/${selectedWebhook.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        toast({
          title: 'Webhook güncellendi',
          description: `${formData.name} webhook'u başarıyla güncellendi.`
        })
        setIsEditOpen(false)
        setSelectedWebhook(null)
        resetForm()
        fetchWebhooks()
      }
    } catch {
      toast({
        title: 'Hata',
        description: 'Webhook güncellenirken bir hata oluştu.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (webhook: Webhook) => {
    if (!confirm(`"${webhook.name}" webhook'unu silmek istediğinizden emin misiniz?`)) return

    try {
      const response = await fetch(`/api/settings/webhooks/${webhook.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast({
          title: 'Webhook silindi',
          description: `${webhook.name} webhook'u başarıyla silindi.`
        })
        fetchWebhooks()
      }
    } catch {
      toast({
        title: 'Hata',
        description: 'Webhook silinirken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  const handleRetry = async (_webhookId: string, _deliveryId: string) => {
    try {
      // Webhook retry API endpoint would be implemented here
      toast({
        title: 'Yeniden deneniyor',
        description: 'Webhook teslimatı yeniden deneniyor...'
      })
    } catch {
      toast({
        title: 'Hata',
        description: 'Yeniden deneme başlatılırken bir hata oluştu.',
        variant: 'destructive'
      })
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      url: '',
      description: '',
      events: [],
      maxRetries: 3,
      retryIntervalSec: 60
    })
  }

  const openEdit = (webhook: Webhook) => {
    setSelectedWebhook(webhook)
    setFormData({
      name: webhook.name,
      url: webhook.url,
      description: webhook.description || '',
      events: webhook.events,
      maxRetries: webhook.maxRetries,
      retryIntervalSec: webhook.retryIntervalSec
    })
    setIsEditOpen(true)
  }

  const toggleEvent = (eventKey: string) => {
    setFormData(prev => ({
      ...prev,
      events: prev.events.includes(eventKey)
        ? prev.events.filter(e => e !== eventKey)
        : [...prev.events, eventKey]
    }))
  }

  const toggleCategory = (category: string) => {
    const categoryEvents = availableEvents
      .filter(e => e.category === category)
      .map(e => e.key)
    const hasAll = categoryEvents.every(e => formData.events.includes(e))

    setFormData(prev => ({
      ...prev,
      events: hasAll
        ? prev.events.filter(e => !categoryEvents.includes(e))
        : [...new Set([...prev.events, ...categoryEvents])]
    }))
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge variant="default" className="bg-green-500">Aktif</Badge>
      case 'PAUSED':
        return <Badge variant="secondary">Duraklatıldı</Badge>
      case 'DISABLED':
        return <Badge variant="destructive">Devre Dışı</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <Badge variant="default" className="bg-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Başarılı</Badge>
      case 'FAILED':
        return <Badge variant="destructive"><X className="h-3 w-3 mr-1" />Başarısız</Badge>
      case 'RETRYING':
        return <Badge variant="secondary"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />Yeniden Deneniyor</Badge>
      case 'PENDING':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Bekliyor</Badge>
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
          <h1 className="text-2xl font-bold">Webhooks</h1>
          <p className="text-muted-foreground">
            Gerçek zamanlı olay bildirimleri için webhook uç noktalarını yapılandırın.
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Webhook
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Yeni Webhook Oluştur</DialogTitle>
            </DialogHeader>
            <WebhookForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Info Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            Webhook Nedir?
          </CardTitle>
          <CardDescription>
            Webhooklar, uygulamanizda gerceklesen olaylari (randevu olusturma, musteri guncelleme vb.)
            harici URLlere aninda bildirir.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Webhooks List */}
      <div className="space-y-4">
        {webhooks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Henüz webhook oluşturulmamış.</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                Ilk Webhookunuzu Olusturun
              </Button>
            </CardContent>
          </Card>
        ) : (
          webhooks.map((webhook) => (
            <Card key={webhook.id} className="group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Webhook className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        {webhook.name}
                        {getStatusBadge(webhook.status)}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">
                        {webhook.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => fetchWebhookDetails(webhook)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEdit(webhook)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive"
                      onClick={() => handleDelete(webhook)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {webhook.description && (
                  <p className="text-sm text-muted-foreground mb-3">{webhook.description}</p>
                )}
                <div className="flex flex-wrap gap-1 mb-4">
                  {webhook.events.slice(0, 5).map((event) => (
                    <Badge key={event} variant="secondary" className="text-xs">
                      {availableEvents.find(e => e.key === event)?.label || event}
                    </Badge>
                  ))}
                  {webhook.events.length > 5 && (
                    <Badge variant="secondary" className="text-xs">
                      +{webhook.events.length - 5} daha
                    </Badge>
                  )}
                </div>
                {webhook.stats && (
                  <div className="flex items-center gap-4 text-sm text-muted-foreground pt-3 border-t">
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle2 className="h-4 w-4" />
                      {webhook.stats.success} başarılı
                    </span>
                    <span className="flex items-center gap-1 text-red-600">
                      <X className="h-4 w-4" />
                      {webhook.stats.failed} başarısız
                    </span>
                    <span className="flex items-center gap-1">
                      <ArrowRight className="h-4 w-4" />
                      {webhook.stats.total} toplam (son 24 saat)
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Webhooku Duzenle</DialogTitle>
          </DialogHeader>
          <WebhookForm />
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedWebhook?.name} - Detaylar</DialogTitle>
          </DialogHeader>
          {selectedWebhook && (
            <Tabs defaultValue="overview">
              <TabsList className="mb-4">
                <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
                <TabsTrigger value="deliveries">Teslimat Geçmişi</TabsTrigger>
                <TabsTrigger value="secret">Secret Anahtar</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Webhook Bilgileri</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">URL</p>
                        <p className="font-medium font-mono text-sm">{selectedWebhook.url}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Durum</p>
                        <p className="font-medium">{getStatusBadge(selectedWebhook.status)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Maksimum Yeniden Deneme</p>
                        <p className="font-medium">{selectedWebhook.maxRetries} kez</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Yeniden Deneme Aralığı</p>
                        <p className="font-medium">{selectedWebhook.retryIntervalSec} saniye</p>
                      </div>
                    </div>
                    <div className="border-t" />
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">Abonelikler</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedWebhook.events.map((event) => (
                          <Badge key={event} variant="secondary">
                            {availableEvents.find(e => e.key === event)?.label || event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="deliveries">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Son Teslimatlar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedWebhook.deliveries && selectedWebhook.deliveries.length > 0 ? (
                      <div className="space-y-3">
                        {selectedWebhook.deliveries.map((delivery) => (
                          <div key={delivery.id} className="border rounded-lg p-3">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getDeliveryStatusBadge(delivery.status)}
                                <span className="font-medium text-sm">{delivery.eventType}</span>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {new Date(delivery.createdAt).toLocaleString('tr-TR')}
                              </span>
                            </div>
                            {delivery.httpStatusCode && (
                              <p className="text-sm text-muted-foreground">
                                HTTP {delivery.httpStatusCode}
                              </p>
                            )}
                            {delivery.errorMessage && (
                              <p className="text-sm text-red-600 mt-1">
                                <AlertCircle className="h-4 w-4 inline mr-1" />
                                {delivery.errorMessage}
                              </p>
                            )}
                            {delivery.status === 'FAILED' && delivery.retryCount < selectedWebhook.maxRetries && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-2"
                                onClick={() => handleRetry(selectedWebhook.id, delivery.id)}
                              >
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Yeniden Dene
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8">
                        Henüz teslimat kaydı yok.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="secret">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Webhook Secret</CardTitle>
                    <CardDescription>
                      Bu secret anahtar, webhook imzası doğrulaması için kullanılır.
                      İstek başlığında X-Webhook-Signature olarak gönderilir.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <code className="block bg-muted p-4 rounded-lg text-sm font-mono break-all">
                      {selectedWebhook.secret}
                    </code>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )

  function WebhookForm() {
    const eventsByCategory = availableEvents.reduce((acc, event) => {
      if (!acc[event.category]) acc[event.category] = []
      acc[event.category].push(event)
      return acc
    }, {} as Record<string, WebhookEvent[]>)

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label>Webhook Adı</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Örn: Müşteri Bildirimleri"
          />
        </div>

        <div className="space-y-2">
          <Label>Webhook URL</Label>
          <Input
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://api.sizinsiteniz.com/webhook"
          />
          <p className="text-xs text-muted-foreground">
            HTTPS URL olmalıdır. Webhook POST istekleri bu adresine gönderilecektir.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Açıklama</Label>
          <Input
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Bu webhook'un kullanım amacı..."
          />
        </div>

        <div className="space-y-4">
          <Label>Abone Olunan Olaylar</Label>
          <div className="space-y-4">
            {Object.entries(eventsByCategory).map(([category, events]) => {
              const allSelected = events.every(e => formData.events.includes(e.key))

              return (
                <Card key={category}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={() => toggleCategory(category)}
                      />
                      <span className="font-medium">{category}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2">
                      {events.map((event) => (
                        <div key={event.key} className="flex items-center gap-2">
                          <Checkbox
                            checked={formData.events.includes(event.key)}
                            onCheckedChange={() => toggleEvent(event.key)}
                          />
                          <span className="text-sm">{event.label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Maksimum Yeniden Deneme</Label>
            <Input
              type="number"
              value={formData.maxRetries}
              onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) || 3 })}
              min={0}
              max={10}
            />
          </div>
          <div className="space-y-2">
            <Label>Yeniden Deneme Aralığı (saniye)</Label>
            <Input
              type="number"
              value={formData.retryIntervalSec}
              onChange={(e) => setFormData({ ...formData, retryIntervalSec: parseInt(e.target.value) || 60 })}
              min={10}
              step={10}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => {
            resetForm()
            setIsCreateOpen(false)
            setIsEditOpen(false)
          }}>
            İptal
          </Button>
          <Button
            onClick={selectedWebhook ? handleUpdate : handleCreate}
            disabled={isSaving || !formData.name || !formData.url || formData.events.length === 0}
          >
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {selectedWebhook ? 'Güncelle' : 'Oluştur'}
          </Button>
        </div>
      </div>
    )
  }
}
