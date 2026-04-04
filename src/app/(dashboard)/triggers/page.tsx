'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Workflow,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Bell,
  Zap
} from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Trigger {
  id: string
  name: string
  description: string | null
  triggerType: string
  action: string
  status: 'active' | 'inactive'
  delayMinutes: number
  _count: {
    logs: number
  }
  createdAt: string
}

const TRIGGER_TYPES: Record<string, { label: string; icon: any }> = {
  booking_created: { label: 'Randevu Oluşturuldu', icon: Plus },
  booking_completed: { label: 'Randevu Tamamlandı', icon: CheckCircle2 },
  booking_cancelled: { label: 'Randevu İptal Edildi', icon: AlertCircle },
  no_show: { label: 'Gelmedi (No-Show)', icon: Clock },
  birthday: { label: 'Doğum Günü', icon: Bell },
  first_visit: { label: 'İlk Ziyaret', icon: Zap },
  loyalty_upgrade: { label: 'Sadakat Yükseltme', icon: Workflow }
}

const ACTION_TYPES: Record<string, string> = {
  send_email: 'E-posta Gönder',
  send_sms: 'SMS Gönder',
  send_whatsapp: 'WhatsApp Gönder',
  create_task: 'Görev Oluştur',
  update_loyalty: 'Sadakat Puanı Ver',
  webhook: 'Webhook Çağrısı'
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Aktif', color: 'bg-green-500' },
  inactive: { label: 'Pasif', color: 'bg-gray-500' }
}

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedTrigger, setSelectedTrigger] = useState<Trigger | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'booking_created',
    action: 'send_email',
    delayMinutes: 0,
    templateId: '',
    status: 'active'
  })

  useEffect(() => {
    fetchTriggers()
  }, [])

  const fetchTriggers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/triggers')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setTriggers(data)
    } catch (error) {
      console.error('Error fetching triggers:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTrigger = async () => {
    try {
      const response = await fetch('/api/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        await fetchTriggers()
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Error creating trigger:', error)
    }
  }

  const deleteTrigger = async () => {
    if (!selectedTrigger) return

    try {
      const response = await fetch(`/api/triggers/${selectedTrigger.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchTriggers()
        setIsDeleteDialogOpen(false)
        setSelectedTrigger(null)
      }
    } catch (error) {
      console.error('Error deleting trigger:', error)
    }
  }

  const toggleTriggerStatus = async (trigger: Trigger) => {
    try {
      const response = await fetch(`/api/triggers/${trigger.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: trigger.status === 'active' ? 'inactive' : 'active'
        })
      })

      if (response.ok) {
        await fetchTriggers()
      }
    } catch (error) {
      console.error('Error updating trigger:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      triggerType: 'booking_created',
      action: 'send_email',
      delayMinutes: 0,
      templateId: '',
      status: 'active'
    })
  }

  const getTriggerIcon = (type: string) => {
    const config = TRIGGER_TYPES[type] || { icon: Zap }
    const Icon = config.icon
    return <Icon className="h-5 w-5" />
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl">
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Otomatik Tetikleyiciler</h1>
          <p className="text-muted-foreground mt-1">
            Belirli olaylara otomatik yanıtlar oluşturun
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Yeni Tetikleyici
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Tetikleyici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{triggers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Aktif
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {triggers.filter(t => t.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Toplam Çalıştırma
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {triggers.reduce((sum, t) => sum + t._count.logs, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Tetikleyici Türü
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(TRIGGER_TYPES).length}</div>
            <p className="text-xs text-muted-foreground">Farklı tür</p>
          </CardContent>
        </Card>
      </div>

      {/* Triggers Grid */}
      {triggers.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Workflow className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Henüz tetikleyici oluşturmadınız.
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              İlk Tetikleyiciyi Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {triggers.map((trigger) => (
            <Card key={trigger.id} className={trigger.status !== 'active' ? 'opacity-60' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      {getTriggerIcon(trigger.triggerType)}
                    </div>
                    <div>
                      <CardTitle className="text-base">{trigger.name}</CardTitle>
                      <CardDescription>
                        {TRIGGER_TYPES[trigger.triggerType]?.label || trigger.triggerType}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={STATUS_LABELS[trigger.status].color}>
                      {STATUS_LABELS[trigger.status].label}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {trigger.description && (
                  <p className="text-sm text-muted-foreground mb-3">
                    {trigger.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{ACTION_TYPES[trigger.action] || trigger.action}</span>
                  </div>
                  {trigger.delayMinutes > 0 && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{trigger.delayMinutes} dk gecikme</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span>{trigger._count.logs} kez çalıştı</span>
                  </div>

                  <div className="flex-1" />

                  <Switch
                    checked={trigger.status === 'active'}
                    onCheckedChange={() => toggleTriggerStatus(trigger)}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSelectedTrigger(trigger); setIsDeleteDialogOpen(true) }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Yeni Tetikleyici</DialogTitle>
            <DialogDescription>
              Otomatik bir işlem tetikleyicisi oluşturun.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>İsim *</Label>
              <Input
                placeholder="örn: Randevu Sonrası Teşekkür Mesajı"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Açıklama</Label>
              <Input
                placeholder="Tetikleyicinin amacı..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tetikleyici Türü *</Label>
                <Select
                  value={formData.triggerType}
                  onValueChange={(value) => setFormData({ ...formData, triggerType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TRIGGER_TYPES).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Aksiyon *</Label>
                <Select
                  value={formData.action}
                  onValueChange={(value) => setFormData({ ...formData, action: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACTION_TYPES).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Gecikme (dakika)</Label>
              <Input
                type="number"
                min="0"
                value={formData.delayMinutes}
                onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">0 = Anında gönder</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              İptal
            </Button>
            <Button onClick={createTrigger} disabled={!formData.name}>
              Oluştur
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Tetikleyiciyi Sil</DialogTitle>
            <DialogDescription>
              Bu tetikleyiciyi silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={deleteTrigger}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
