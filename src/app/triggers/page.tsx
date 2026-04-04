'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Bell,
  Plus,
  Play,
  Pause,
  Trash2,
  MessageSquare,
  Mail,
  Smartphone,
  Clock,
  Calendar,
  UserX,
  UserCheck,
  Gift,
  AlertTriangle
} from 'lucide-react'

interface Trigger {
  id: string
  name: string
  description: string | null
  triggerType: string
  action: string
  status: string
  delayMinutes: number
  triggerCount: number
  lastTriggeredAt: string | null
  createdAt: string
  _count: { logs: number }
}

const TRIGGER_TYPES = {
  booking_confirmed: { label: 'Randevu Onaylandığında', icon: Calendar },
  booking_cancelled: { label: 'Randevu İptal Edildiğinde', icon: UserX },
  booking_no_show: { label: 'No-Show Olduğunda', icon: AlertTriangle },
  booking_completed: { label: 'Randevu Tamamlandığında', icon: UserCheck },
  appointment_reminder_24h: { label: '24 Saat Önce Hatırlatma', icon: Clock },
  appointment_reminder_2h: { label: '2 Saat Önce Hatırlatma', icon: Clock },
  customer_birthday: { label: 'Müşteri Doğum Günü', icon: Gift },
  customer_at_risk: { label: 'Riskli Müşteri', icon: AlertTriangle },
  customer_inactive_30d: { label: '30 Gün İnaktif', icon: UserX },
  customer_inactive_60d: { label: '60 Gün İnaktif', icon: UserX }
}

const ACTIONS = {
  send_sms: { label: 'SMS Gönder', icon: Smartphone },
  send_email: { label: 'E-posta Gönder', icon: Mail },
  send_notification: { label: 'Bildirim Gönder', icon: Bell }
}

const STATUSES = {
  active: { label: 'Aktif', variant: 'default' as const },
  paused: { label: 'Duraklatıldı', variant: 'secondary' as const },
  draft: { label: 'Taslak', variant: 'outline' as const }
}

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<Trigger[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchTriggers()
  }, [])

  const fetchTriggers = async () => {
    try {
      const response = await fetch('/api/triggers')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setTriggers(data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = async (trigger: Trigger) => {
    const newStatus = trigger.status === 'active' ? 'paused' : 'active'
    try {
      const response = await fetch(`/api/triggers/${trigger.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchTriggers()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const deleteTrigger = async (id: string) => {
    if (!confirm('Bu tetikleyiciyi silmek istediğinize emin misiniz?')) return

    try {
      const response = await fetch(`/api/triggers/${id}`, { method: 'DELETE' })
      if (response.ok) {
        fetchTriggers()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const executeTrigger = async (trigger: Trigger) => {
    try {
      const response = await fetch(`/api/triggers/${trigger.id}/execute`, {
        method: 'POST'
      })
      if (response.ok) {
        alert('Tetikleyici çalıştırıldı!')
        fetchTriggers()
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-40" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Otomatik Tetikleyiciler</h1>
          <p className="text-muted-foreground">
            Belirli olaylara otomatik olarak kampanya gönderin
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Yeni Tetikleyici
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Tetikleyici Oluştur</DialogTitle>
            </DialogHeader>
            <CreateTriggerForm
              onSuccess={() => {
                setShowCreateDialog(false)
                fetchTriggers()
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {triggers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">
                Henüz tetikleyici oluşturulmamış.
                <br />
                Otomatik kampanyalar için bir tetikleyici ekleyin.
              </p>
            </CardContent>
          </Card>
        ) : (
          triggers.map((trigger) => {
            const TriggerIcon = TRIGGER_TYPES[trigger.triggerType as keyof typeof TRIGGER_TYPES]?.icon || Bell
            const ActionIcon = ACTIONS[trigger.action as keyof typeof ACTIONS]?.icon || MessageSquare
            const statusConfig = STATUSES[trigger.status as keyof typeof STATUSES]

            return (
              <Card key={trigger.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <TriggerIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{trigger.name}</CardTitle>
                        <CardDescription>
                          {TRIGGER_TYPES[trigger.triggerType as keyof typeof TRIGGER_TYPES]?.label || trigger.triggerType}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusConfig.variant}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <ActionIcon className="h-4 w-4" />
                        <span>
                          {ACTIONS[trigger.action as keyof typeof ACTIONS]?.label || trigger.action}
                        </span>
                      </div>
                      {trigger.delayMinutes > 0 && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{trigger.delayMinutes} dk gecikme</span>
                        </div>
                      )}
                      <div>
                        {trigger.triggerCount} çalıştırma
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => executeTrigger(trigger)}
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleStatus(trigger)}
                      >
                        {trigger.status === 'active' ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTrigger(trigger.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}

function CreateTriggerForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    triggerType: 'booking_confirmed',
    action: 'send_sms',
    delayMinutes: 0
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch('/api/triggers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        onSuccess()
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label className="text-sm font-medium">Tetikleyici Adı</label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Örn: Randevu Onay SMS'i"
          required
        />
      </div>

      <div>
        <label className="text-sm font-medium">Açıklama</label>
        <Input
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Tetikleyicinin ne zaman çalıştığını açıklayın"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Tetikleyici Tipi</label>
        <select
          className="w-full h-10 px-3 rounded-md border border-input bg-background"
          value={formData.triggerType}
          onChange={(e) => setFormData({ ...formData, triggerType: e.target.value })}
        >
          {Object.entries(TRIGGER_TYPES).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Aksiyon</label>
        <select
          className="w-full h-10 px-3 rounded-md border border-input bg-background"
          value={formData.action}
          onChange={(e) => setFormData({ ...formData, action: e.target.value })}
        >
          {Object.entries(ACTIONS).map(([key, { label }]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Gecikme (dakika)</label>
        <Input
          type="number"
          min={0}
          value={formData.delayMinutes}
          onChange={(e) => setFormData({ ...formData, delayMinutes: parseInt(e.target.value) || 0 })}
          placeholder="0 = hemen gönder"
        />
        <p className="text-xs text-muted-foreground mt-1">
          Olaydan sonra kaç dakika beklesin (0 = hemen)
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? 'Oluşturuluyor...' : 'Tetikleyici Oluştur'}
      </Button>
    </form>
  )
}
