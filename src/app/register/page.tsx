'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { slugify } from '@/lib/utils'
import { ArrowRight, Sparkles, Star, TrendingUp, Zap } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    slug: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleBusinessNameChange = (value: string) => {
    setFormData({
      ...formData,
      businessName: value,
      slug: slugify(value)
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Kayıt sırasında bir hata oluştu')
        return
      }

      const signInResult = await signIn('credentials', {
        redirect: false,
        email: formData.email,
        password: formData.password
      })

      if (signInResult?.error) {
        router.push('/login')
      } else {
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const stats = [
    { icon: Star, value: '1.200+', label: 'Aktif İşletme' },
    { icon: TrendingUp, value: '%80', label: 'Azalan No-Show' },
    { icon: Zap, value: '500K+', label: 'Tamamlanan Randevu' }
  ]

  return (
    <div className="min-h-screen flex">
      {/* Left: Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0f0825 0%, #1e1145 40%, #2d1b69 100%)' }}>
        {/* Dot Grid */}
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.06]" />

        {/* Floating Orbs */}
        <div className="absolute top-32 right-20 w-64 h-64 bg-purple-500/15 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-purple-200 text-xs font-medium mb-8 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              14 gün ücretsiz deneyin
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              Dakikalar içinde<br/>
              <span className="text-purple-300">profesyonel</span><br/>
              randevu sayfanız hazır
            </h1>

            <p className="text-purple-200/70 text-lg max-w-md mb-12 leading-relaxed">
              Kayıt olun, hizmetlerinizi ekleyin, müşterilerinize randevu linkini paylaşın. Hepsi bu kadar.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              {stats.map((stat, i) => (
                <div 
                  key={stat.label}
                  className="text-center animate-slide-up" 
                  style={{ animationDelay: `${0.3 + i * 0.15}s`, animationFillMode: 'both' }}
                >
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2 border border-white/10 backdrop-blur-sm">
                    <stat.icon className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-purple-300/60">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-neutral-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <Link href="/" className="inline-flex items-center gap-1 text-3xl font-bold">
              <span className="text-gradient">Randevu</span>
              <span className="text-neutral-900">AI</span>
            </Link>
            <h2 className="mt-6 text-2xl font-bold text-neutral-900">
              İşletmenizi kaydedin
            </h2>
            <p className="mt-2 text-neutral-500 text-sm">
              Zaten hesabınız var mı?{' '}
              <Link href="/login" className="text-primary-600 hover:text-primary-500 font-semibold transition-colors">
                Giriş yapın
              </Link>
            </p>
          </div>

          <div className="glass-card p-8">
            <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-scale-in">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-600 mb-1.5">
                  Ad Soyad
                </label>
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="input-premium"
                  placeholder="Ahmet Yılmaz"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-600 mb-1.5">
                  E-posta
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="input-premium"
                  placeholder="ahmet@firmam.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-600 mb-1.5">
                  Şifre
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="input-premium"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label htmlFor="businessName" className="block text-sm font-medium text-neutral-600 mb-1.5">
                  İşletme Adı
                </label>
                <input
                  id="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => handleBusinessNameChange(e.target.value)}
                  required
                  className="input-premium"
                  placeholder="Elya Berber"
                />
              </div>

              <div>
                <label htmlFor="slug" className="block text-sm font-medium text-neutral-600 mb-1.5">
                  Randevu Sayfası URL
                </label>
                <div className="flex rounded-xl overflow-hidden border border-neutral-200 shadow-sm focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-500/12 transition-all">
                  <span className="inline-flex items-center px-3 bg-neutral-50 text-neutral-400 text-sm border-r border-neutral-200 select-none">
                    randevuai.com/b/
                  </span>
                  <input
                    id="slug"
                    type="text"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                    required
                    className="flex-1 block w-full px-3 py-2.5 border-0 focus:ring-0 focus:outline-none text-sm bg-white"
                    placeholder="elya-berber"
                  />
                </div>
                <p className="mt-1.5 text-xs text-neutral-400">
                  Müşterileriniz bu link üzerinden randevu alacak
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm mt-2"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Hesap oluşturuluyor...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Hesap Oluştur
                    <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6">
            Kayıt olarak{' '}
            <Link href="#" className="underline hover:text-neutral-600 transition-colors">Kullanım Şartları</Link>
            {' '}ve{' '}
            <Link href="#" className="underline hover:text-neutral-600 transition-colors">Gizlilik Politikası</Link>
            &apos;nı kabul etmiş olursunuz.
          </p>
        </div>
      </div>
    </div>
  )
}
