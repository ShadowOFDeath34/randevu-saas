'use client'

import { useState, useEffect, use } from 'react'
import { Sparkles, CheckCircle2, Store, Loader2, ArrowRight } from 'lucide-react'

export default function KioskPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const [phone, setPhone] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const [businessName, setBusinessName] = useState('İşletme')
  const [loadingInitial, setLoadingInitial] = useState(true)

  useEffect(() => {
    // Fetch business name to show on Kiosk
    fetch(`/api/public/business/${resolvedParams.slug}`)
      .then(res => res.json())
      .then(data => {
        if (data.business) setBusinessName(data.business.businessName)
        setLoadingInitial(false)
      })
      .catch(() => setLoadingInitial(false))
  }, [resolvedParams.slug])

  const handleKeyPress = (num: string) => {
    if (phone.length < 15) {
      setPhone(prev => prev + num)
    }
  }

  const handleDelete = () => {
    setPhone(prev => prev.slice(0, -1))
  }

  const handleSubmit = async () => {
    if (phone.length < 10) {
      setStatus('error')
      setMessage('Lütfen geçerli bir telefon numarası girin.')
      setTimeout(() => setStatus('idle'), 3000)
      return
    }

    setStatus('loading')
    try {
      const res = await fetch('/api/public/kiosk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: resolvedParams.slug, phone })
      })
      
      const data = await res.json()
      
      if (res.ok) {
        setStatus('success')
        setMessage(data.message)
        setPhone('')
        // Reset after 5 seconds to be ready for the next customer
        setTimeout(() => {
          setStatus('idle')
          setMessage('')
        }, 5000)
      } else {
        setStatus('error')
        setMessage(data.error || 'Bir hata oluştu.')
        setTimeout(() => setStatus('idle'), 4000)
      }
    } catch (err) {
      setStatus('error')
      setMessage('Ağ hatası oluştu.')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  if (loadingInitial) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-950 flex relative overflow-hidden text-white font-sans selection:bg-primary-500/30">
      {/* Decorative Orbs */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-900/20 rounded-full blur-[120px] pointer-events-none -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-900/20 rounded-full blur-[100px] pointer-events-none translate-y-1/3 -translate-x-1/4" />
      <div className="absolute inset-0 bg-dot-pattern opacity-[0.03] pointer-events-none" />

      {/* Main Kiosk Content */}
      <div className="w-full flex flex-col items-center justify-center p-8 relative z-10 max-w-2xl mx-auto text-center">
        
        <div className="mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl mb-6 shadow-2xl">
            <Store className="w-10 h-10 text-primary-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4 text-white drop-shadow-lg">
            {businessName}
          </h1>
          <p className="text-xl text-neutral-400 font-light">
            Randevunuz için geldiğinizi bildirin.
          </p>
        </div>

        <div className="w-full max-w-md bg-white/5 border border-white/10 p-8 rounded-[2rem] backdrop-blur-2xl shadow-2xl animate-slide-up">
          
          {status === 'success' ? (
            <div className="py-12 animate-fade-in flex flex-col items-center">
              <div className="w-24 h-24 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mb-6 ring-4 ring-emerald-500/30 ring-offset-4 ring-offset-neutral-950">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">Check-in Başarılı!</h2>
              <p className="text-emerald-200 text-center leading-relaxed">
                {message}
              </p>
            </div>
          ) : (
            <div className="animate-fade-in">
              <div className="mb-8">
                <div className="text-sm font-medium text-neutral-400 uppercase tracking-widest mb-3">Telefon Numaranız</div>
                <div className="h-16 w-full bg-black/40 border border-white/10 rounded-2xl flex items-center justify-center text-3xl font-mono tracking-wider shadow-inner">
                  {phone || <span className="text-neutral-600">__________</span>}
                </div>
                {status === 'error' && (
                  <p className="text-red-400 text-sm mt-3 animate-shake font-medium bg-red-500/10 p-2 rounded-lg">{message}</p>
                )}
              </div>

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-3 mb-8">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                  <button
                    key={num}
                    onClick={() => handleKeyPress(num.toString())}
                    className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-2xl font-medium transition-all active:scale-95"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={handleDelete}
                  className="h-16 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 font-medium transition-all active:scale-95 text-lg"
                >
                  Sil
                </button>
                <button
                  onClick={() => handleKeyPress('0')}
                  className="h-16 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-2xl font-medium transition-all active:scale-95"
                >
                  0
                </button>
                <div className="h-16" /> {/* Empty slot */}
              </div>

              <button
                onClick={handleSubmit}
                disabled={phone.length === 0 || status === 'loading'}
                className="w-full h-16 rounded-2xl bg-primary-600 hover:bg-primary-500 text-white font-semibold text-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-primary-900/50"
              >
                {status === 'loading' ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    Geldim, Buradayım <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          )}

        </div>

        <div className="mt-12 flex items-center gap-2 text-neutral-500 text-sm font-medium">
          <Sparkles className="w-4 h-4" />
          Powered by RandevuAI Kiosk System
        </div>
      </div>
    </div>
  )
}
