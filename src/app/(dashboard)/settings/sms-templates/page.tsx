'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  MessageSquare,
  Edit2,
  Save,
  X,
  RotateCcw,
  AlertCircle,
  CheckCircle,
  Info,
  Smartphone,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface SMSTemplate {
  id: string
  type: string
  title: string
  body: string
  isActive: boolean
}

interface TemplateVariable {
  key: string
  label: string
  description: string
}

interface TemplateVariablesMap {
  [key: string]: TemplateVariable[]
}

export default function SMSTemplatesPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [selectedVariables, setSelectedVariables] = useState<TemplateVariable[]>([])
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  const [expandedRef, setExpandedRef] = useState(false)

  // Fetch templates
  const { data, isLoading } = useQuery<{ templates: SMSTemplate[]; variables: TemplateVariablesMap }>({
    queryKey: ['sms-templates'],
    queryFn: async () => {
      const res = await fetch('/api/settings/sms-templates')
      if (!res.ok) throw new Error('Failed to fetch templates')
      return res.json()
    }
  })

  const templates = data?.templates || []
  const variables = data?.variables || {}

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, body, isActive }: { id: string; body?: string; isActive?: boolean }) => {
      const res = await fetch('/api/settings/sms-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, body, isActive })
      })
      if (!res.ok) throw new Error('Failed to update template')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast({ title: 'Başarılı', description: 'Şablon güncellendi', variant: 'success' })
      setEditingId(null)
    },
    onError: () => {
      toast({ title: 'Hata', description: 'Şablon güncellenirken hata oluştu', variant: 'destructive' })
    }
  })

  // Reset templates mutation
  const resetMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/settings/sms-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' })
      })
      if (!res.ok) throw new Error('Failed to reset templates')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sms-templates'] })
      toast({ title: 'Başarılı', description: 'Şablonlar varsayılan değerlere döndürüldü', variant: 'success' })
      setShowResetConfirm(false)
    },
    onError: () => {
      toast({ title: 'Hata', description: 'Şablonlar sıfırlanırken hata oluştu', variant: 'destructive' })
    }
  })

  const startEditing = (template: SMSTemplate) => {
    setEditingId(template.id)
    setEditBody(template.body)
    setSelectedVariables(variables[template.type] || [])
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditBody('')
    setSelectedVariables([])
  }

  const saveTemplate = (template: SMSTemplate) => {
    updateMutation.mutate({ id: template.id, body: editBody })
  }

  const toggleTemplate = (template: SMSTemplate) => {
    updateMutation.mutate({
      id: template.id,
      isActive: !template.isActive
    })
  }

  // Calculate SMS segments
  const calculateSegments = (text: string) => {
    const hasUnicode = /[^\u0000-\u007F]/.test(text)
    const maxChars = hasUnicode ? 70 : 160
    const chars = text.length
    const segments = Math.ceil(chars / maxChars)
    return { chars, segments, maxChars, hasUnicode }
  }

  // Insert variable at cursor position
  const insertVariable = (variable: string) => {
    setEditBody(prev => prev + `{{${variable}}}`)
  }

  // Get template type badge color
  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      booking_confirmation: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      booking_reminder_24h: 'bg-amber-100 text-amber-700 border-amber-200',
      booking_reminder_1h: 'bg-orange-100 text-orange-700 border-orange-200',
      booking_cancelled: 'bg-red-100 text-red-700 border-red-200',
      booking_updated: 'bg-blue-100 text-blue-700 border-blue-200',
      kiosk_welcome: 'bg-violet-100 text-violet-700 border-violet-200',
      verification_code: 'bg-neutral-100 text-neutral-700 border-neutral-200'
    }
    return colors[type] || 'bg-neutral-100 text-neutral-700 border-neutral-200'
  }

  // Get template type label
  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      booking_confirmation: 'Randevu Onayı',
      booking_reminder_24h: '24 Saat Hatırlatma',
      booking_reminder_1h: '1 Saat Hatırlatma',
      booking_cancelled: 'Randevu İptali',
      booking_updated: 'Randevu Güncelleme',
      kiosk_welcome: 'Kiosk Giriş',
      verification_code: 'Doğrulama Kodu'
    }
    return labels[type] || type
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-neutral-100 rounded w-1/3 animate-pulse" />
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-neutral-100 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">SMS Şablonları</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Müşterilere gönderilen SMS mesajlarını özelleştirin
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => setShowResetConfirm(true)}
          className="text-neutral-600"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Varsayılanlara Döndür
        </Button>
      </div>

      {/* Info Alert - Custom styled */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-blue-900 text-sm font-medium">Bilgi</p>
          <p className="text-blue-700 text-sm mt-1">
            Şablonlarda {'{{'}değişken{'}}'} formatını kullanarak dinamik değerler ekleyebilirsiniz.
            Değişkenler otomatik olarak müşteri/randevu bilgileriyle değiştirilir.
          </p>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid gap-4">
        {templates.map((template) => {
          const isEditing = editingId === template.id
          const stats = calculateSegments(isEditing ? editBody : template.body)

          return (
            <div
              key={template.id}
              className={`bg-white rounded-xl border ${isEditing ? 'border-primary-500 ring-2 ring-primary-500/20' : 'border-neutral-200'} overflow-hidden`}
            >
              {/* Card Header */}
              <div className="px-5 py-4 border-b border-neutral-100">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-neutral-900">
                          {template.title}
                        </h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${getTypeBadge(template.type)}`}>
                          {getTypeLabel(template.type)}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {stats.chars} karakter / {stats.segments} SMS {stats.hasUnicode && '(Türkçe karakterler)'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <>
                        {/* Custom Switch */}
                        <div
                          className="flex items-center gap-2 cursor-pointer"
                          onClick={() => toggleTemplate(template)}
                        >
                          <div className={`w-10 h-5 rounded-full relative transition-colors ${template.isActive ? 'bg-emerald-500' : 'bg-neutral-300'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${template.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                          </div>
                          <span className="text-xs text-neutral-600">{template.isActive ? 'Aktif' : 'Pasif'}</span>
                        </div>
                        <button
                          onClick={() => startEditing(template)}
                          className="p-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => saveTemplate(template)}
                          disabled={updateMutation.isPending}
                          className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="px-5 py-4">
                {isEditing ? (
                  <div className="space-y-4">
                    {/* Custom Textarea */}
                    <textarea
                      value={editBody}
                      onChange={(e) => setEditBody(e.target.value)}
                      className="w-full min-h-[100px] px-3 py-2 border border-neutral-200 rounded-lg font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="SMS metnini buraya yazın..."
                    />

                    {/* Character count */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Smartphone className="w-4 h-4" />
                        <span>{stats.chars} / {stats.maxChars} karakter</span>
                        {stats.segments > 1 && (
                          <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-700">
                            {stats.segments} SMS gönderilecek
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Variables */}
                    {selectedVariables.length > 0 && (
                      <div className="border-t border-neutral-100 pt-3">
                        <p className="text-xs font-medium text-neutral-700 mb-2">
                          Kullanılabilir değişkenler (tıklayarak ekle):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedVariables.map((v) => (
                            <button
                              key={v.key}
                              onClick={() => insertVariable(v.key)}
                              title={v.description}
                              className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded border border-blue-200 hover:bg-blue-100 transition-colors"
                            >
                              {v.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview */}
                    <div className="border border-neutral-200 rounded-lg p-3 bg-neutral-50">
                      <p className="text-xs font-medium text-neutral-500 mb-2">Önizleme:</p>
                      <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                        {editBody}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-neutral-800 whitespace-pre-wrap">
                      {template.body}
                    </p>
                    {template.isActive === false && (
                      <div className="flex items-center gap-2 text-amber-600 text-xs">
                        <AlertCircle className="w-3 h-3" />
                        <span>Bu şablon pasif durumda</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset Confirmation Dialog - Custom styled */}
      {showResetConfirm && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                Varsayılan Şablonlara Döndür
              </h3>
              <p className="text-sm text-neutral-600">
                Tüm SMS şablonlarını varsayılan değerlerine döndürmek istediğinize emin misiniz?
                Bu işlem geri alınamaz.
              </p>
            </div>
            <div className="px-6 py-4 bg-neutral-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowResetConfirm(false)}
                disabled={resetMutation.isPending}
              >
                İptal
              </Button>
              <Button
                variant="destructive"
                onClick={() => resetMutation.mutate()}
                disabled={resetMutation.isPending}
              >
                {resetMutation.isPending ? 'İşleniyor...' : 'Evet, Döndür'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Variables Reference - Custom styled */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden mt-8">
        <div
          className="px-5 py-4 border-b border-neutral-100 flex items-center justify-between cursor-pointer hover:bg-neutral-50"
          onClick={() => setExpandedRef(!expandedRef)}
        >
          <div>
            <h3 className="text-base font-semibold text-neutral-900">Değişken Referansı</h3>
            <p className="text-sm text-neutral-500">
              Şablonlarda kullanabileceğiniz tüm değişkenler
            </p>
          </div>
          {expandedRef ? <ChevronUp className="w-5 h-5 text-neutral-400" /> : <ChevronDown className="w-5 h-5 text-neutral-400" />}
        </div>

        {expandedRef && (
          <div className="px-5 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-neutral-900">Genel Değişkenler</h4>
                <div className="space-y-2">
                  {[
                    { key: 'customerName', label: 'Müşteri Adı', desc: 'Müşterinin tam adı' },
                    { key: 'serviceName', label: 'Hizmet', desc: 'Randevu alınan hizmet' },
                    { key: 'businessName', label: 'İşletme', desc: 'İşletme adı' },
                  ].map(v => (
                    <div key={v.key} className="flex items-center gap-2 text-sm">
                      <code className="px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded text-xs">{'{{' + v.key + '}}'}</code>
                      <span className="text-neutral-600">{v.label}</span>
                      <span className="text-neutral-400">- {v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-neutral-900">Randevu Değişkenleri</h4>
                <div className="space-y-2">
                  {[
                    { key: 'date', label: 'Tarih', desc: 'Randevu tarihi' },
                    { key: 'time', label: 'Saat', desc: 'Randevu saati' },
                    { key: 'confirmationCode', label: 'Onay Kodu', desc: 'Randevu onay kodu' },
                    { key: 'staffName', label: 'Personel', desc: 'Atanan personel' },
                  ].map(v => (
                    <div key={v.key} className="flex items-center gap-2 text-sm">
                      <code className="px-1.5 py-0.5 bg-neutral-100 text-neutral-700 rounded text-xs">{'{{' + v.key + '}}'}</code>
                      <span className="text-neutral-600">{v.label}</span>
                      <span className="text-neutral-400">- {v.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <p className="font-medium">Önemli Not:</p>
                  <p className="mt-1">
                    SMS başına 160 karakter (Türkçe karakterler için 70) limiti vardır.
                    Uzun mesajlar otomatik olarak birden fazla SMS olarak bölünür.
                    Her ek SMS ek ücrete tabidir.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
