'use client'

import { useState } from 'react'
import { Sparkles, Send, Users, Smartphone, Mail, Plus, Clock, FileText, CheckCircle2 } from 'lucide-react'
import { useCampaigns, useGenerateCampaign, useCreateCampaign, useSendCampaign } from '@/hooks/use-campaigns'
import { formatDate } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface Campaign {
  id: string
  name: string
  targetSegment: string
  type: string
  content: string
  aiGenerated: boolean
  status: string
  sentAt: string | null
  sentCount: number
  createdAt: string
  user: { name: string }
}

export default function CampaignsPage() {
  const { data: campaignsData, isLoading } = useCampaigns()
  const generateCampaign = useGenerateCampaign()
  const createCampaign = useCreateCampaign()
  const sendCampaign = useSendCampaign()

  const campaigns = campaignsData?.campaigns || []

  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [segment, setSegment] = useState('all')
  const [type, setType] = useState('sms')
  const [content, setContent] = useState('')
  const [aiGenerated, setAiGenerated] = useState(false)

  const handleGenerateAI = async () => {
    const data = await generateCampaign.mutateAsync({ segment, type })
    if (data.content) {
      setContent(data.content)
      setAiGenerated(true)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    await createCampaign.mutateAsync({
      name,
      targetSegment: segment,
      type,
      content,
      aiGenerated
    })
    setShowForm(false)
    setName('')
    setContent('')
    setAiGenerated(false)
  }

  const handleSend = async (id: string) => {
    if (!confirm('Bu kampanyayı göndermek istediğinize emin misiniz?')) return
    await sendCampaign.mutateAsync(id)
  }

  const segments = [
    { id: 'all', label: 'Tüm Müşteriler', desc: 'Sisteme kayıtlı herkes' },
    { id: 'loyal', label: 'Sadık Müşteriler', desc: 'Son 3 ayda 3+ kere gelenler' },
    { id: 'at_risk', label: 'Kayıp Riskli', desc: 'Son 3 aydır gelmeyenler' },
    { id: 'new', label: 'Yeni Müşteriler', desc: 'Sadece 1 kere gelenler' }
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="card-premium overflow-hidden">
          <div className="p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full mb-2" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-primary-500" />
            Akıllı Pazarlama (CRM)
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Yapay zeka analizleriyle kişiselleştirilmiş kampanyalar oluşturun.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)} className="btn-primary py-2.5 px-5 text-sm">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Kampanya
          </button>
        )}
      </div>

      {showForm ? (
        <div className="grid lg:grid-cols-2 gap-6 animate-slide-up">
          {/* Form */}
          <div className="card-premium p-6">
            <h2 className="text-lg font-semibold text-neutral-900 mb-6">Kampanya Detayları</h2>
            <form onSubmit={handleSave} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-neutral-600 mb-1.5">Kampanya Adı</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-premium"
                  placeholder="Örn: İlkbahar İndirimi '26"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1.5">Gönderim Tipi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setType('sms')}
                      className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${type === 'sms' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:border-primary-200'}`}
                    >
                      <Smartphone className="w-4 h-4" /> SMS
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('email')}
                      className={`py-2 px-3 border rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-all ${type === 'email' ? 'border-primary-400 bg-primary-50 text-primary-700' : 'border-neutral-200 text-neutral-600 hover:border-primary-200'}`}
                    >
                      <Mail className="w-4 h-4" /> E-Posta
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-600 mb-1.5">Hedef Kitle (Segment)</label>
                  <select
                    value={segment}
                    onChange={(e) => setSegment(e.target.value)}
                    className="input-premium"
                  >
                    {segments.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-neutral-600">Mesaj İçeriği</label>
                  <button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={generateCampaign.isPending}
                    className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {generateCampaign.isPending ? 'Yazılıyor...' : 'AI ile Metin Üret'}
                  </button>
                </div>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value)
                    setAiGenerated(false)
                  }}
                  rows={type === 'sms' ? 3 : 6}
                  className="input-premium resize-none"
                  placeholder="Mesajınızı buraya yazın veya AI'dan destek alın..."
                  required
                />
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-xs ${content.length > (type === 'sms' ? 160 : 1000) ? 'text-red-500' : 'text-neutral-400'}`}>
                    {content.length} / {type === 'sms' ? '160 (1 SMS)' : '1000'} karakter
                  </span>
                  {aiGenerated && (
                    <span className="text-xs text-violet-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      AI tarafından optimum dönüşüm için optimize edildi
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="btn-secondary py-2.5 px-6"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={createCampaign.isPending || !content || !name}
                  className="btn-primary py-2.5 px-6 flex-1"
                >
                  {createCampaign.isPending ? 'Kaydediliyor...' : 'Taslak Olarak Kaydet'}
                </button>
              </div>
            </form>
          </div>

          {/* AI Helper / Target Info */}
          <div className="card-premium bg-gradient-to-br from-neutral-900 to-primary-950 text-white p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-dot-pattern opacity-10" />
            <div className="absolute top-10 right-10 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-primary-200 text-xs font-semibold mb-6 border border-white/10 backdrop-blur-sm">
                <Users className="w-3.5 h-3.5" />
                Hedef Kitle Analizi
              </div>

              <h3 className="text-2xl font-bold mb-2">
                {segments.find(s => s.id === segment)?.label}
              </h3>
              <p className="text-primary-200/80 text-sm mb-8 leading-relaxed">
                {segments.find(s => s.id === segment)?.desc}. Bu kitleye özel gönderilecek mesajların dönüşüm oranı %14 - %25 arasında değişmektedir.
              </p>

              <div className="bg-black/20 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-3 text-primary-300 font-medium text-sm">
                  <Sparkles className="w-4 h-4" />
                  Yapay Zeka Ne Diyor?
                </div>
                {segment === 'at_risk' && <p className="text-sm text-neutral-300 leading-relaxed">Riskli müşterilere sert indirimler (%20+) veya kısa süreli fırsatlar (FOMO) sunmak onları geri kazanmada en etkili yöntemdir.</p>}
                {segment === 'loyal' && <p className="text-sm text-neutral-300 leading-relaxed">Sadık müşteriler paraya değil, değerli hissetmeye odaklanır. Onlara &ldquo;Özel Hediye&rdquo;, &ldquo;Öncelikli Bakım&rdquo; veya &ldquo;VIP&rdquo; gibi kelimelerle yaklaşın.</p>}
                {segment === 'new' && <p className="text-sm text-neutral-300 leading-relaxed">Yeni gelenlerin alışkanlık kazanması için 2. ziyaret teşviki kritiktir. Küçük bir jest veya ufak bir yüzde indirimi bağlayıcılığı %60 artırır.</p>}
                {segment === 'all' && <p className="text-sm text-neutral-300 leading-relaxed">Tüm kitleye genelleştirilmiş mesajlar atarken, herkesin ilgisini çekecek net, kısa ve eyleme geçirici cümleler (CTA) kullanın.</p>}
              </div>

              <div className="mt-8">
                <div className="text-xs text-primary-400 font-semibold uppercase tracking-wider mb-3">Önizleme</div>
                <div className={`bg-white text-neutral-900 p-4 rounded-xl shadow-xl ${type === 'sms' ? 'rounded-br-sm' : ''}`}>
                  <p className={`text-sm leading-relaxed whitespace-pre-wrap ${content ? 'text-neutral-800' : 'text-neutral-400'}`}>
                    {content || 'Mesaj içeriği burada görünecek...'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card-premium overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 border-b border-neutral-100 uppercase text-[10px] font-bold tracking-wider text-neutral-500">
                  <th className="p-4 pl-6 font-medium">Kampanya</th>
                  <th className="p-4 font-medium">Segment</th>
                  <th className="p-4 font-medium">Kanal</th>
                  <th className="p-4 font-medium">Durum</th>
                  <th className="p-4 font-medium">Tarih</th>
                  <th className="p-4 pr-6 text-right font-medium">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {campaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-12 text-center text-neutral-500">
                      <Sparkles className="w-8 h-8 mx-auto text-neutral-300 mb-3" />
                      <p className="font-medium text-neutral-900 mb-1">Hiç kampanya yok</p>
                      <p className="text-sm mt-1">Hemen yeni bir yapay zeka destekli kampanya oluşturun.</p>
                      <button onClick={() => setShowForm(true)} className="btn-secondary py-2 px-4 text-sm mt-4">
                        Oluşturmaya Başla
                      </button>
                    </td>
                  </tr>
                ) : (
                  campaigns.map((campaign: Campaign) => (
                    <tr key={campaign.id} className="hover:bg-neutral-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${campaign.aiGenerated ? 'bg-violet-50 text-violet-600' : 'bg-neutral-100 text-neutral-600'}`}>
                            {campaign.aiGenerated ? <Sparkles className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900 text-sm">{campaign.name}</p>
                            <p className="text-xs text-neutral-400 mt-0.5 max-w-[200px] truncate">{campaign.content}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-neutral-100 text-neutral-700">
                          {segments.find(s => s.id === campaign.targetSegment)?.label || campaign.targetSegment}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-600 uppercase tracking-wider">
                          {campaign.type === 'sms' ? <Smartphone className="w-3.5 h-3.5" /> : <Mail className="w-3.5 h-3.5" />}
                          {campaign.type}
                        </span>
                      </td>
                      <td className="p-4">
                        {campaign.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {campaign.sentCount} İletildi
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100">
                            <Clock className="w-3.5 h-3.5" />
                            Taslak
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-xs font-medium text-neutral-500 whitespace-nowrap">
                        {formatDate(campaign.sentAt || campaign.createdAt)}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        {campaign.status === 'draft' ? (
                          <button
                            onClick={() => handleSend(campaign.id)}
                            disabled={sendCampaign.isPending}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 hover:shadow-md hover:shadow-primary-600/20 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            Gönder
                          </button>
                        ) : (
                          <span className="text-xs text-neutral-400 font-medium px-3 py-1.5">Tamamlandı</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
