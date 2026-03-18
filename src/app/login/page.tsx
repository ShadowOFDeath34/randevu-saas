'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Chrome, ArrowRight, Sparkles, Clock, Users, Shield } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        redirect: false,
        email,
        password
      })

      if (result?.error) {
        setError('E-posta veya şifre hatalı')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      setError('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl })
  }

  return (
    <div className="space-y-5 animate-slide-up">
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-scale-in">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={() => handleOAuthSignIn('google')}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-neutral-200 rounded-xl bg-white text-neutral-700 hover:bg-neutral-50 hover:border-neutral-300 transition-all duration-200 font-medium text-sm shadow-premium-sm"
      >
        <Chrome className="w-5 h-5" />
        Google ile giriş yap
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-neutral-400 font-medium">ya da</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-neutral-600 mb-1.5">
            E-posta
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-premium"
            placeholder="ornek@email.com"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="password" className="block text-sm font-medium text-neutral-600">
              Şifre
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-primary-600 hover:text-primary-500 transition-colors">
              Şifremi unuttum?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="input-premium"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-3 text-sm"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Giriş yapılıyor...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              Giriş Yap
              <ArrowRight className="w-4 h-4" />
            </span>
          )}
        </button>
      </form>
    </div>
  )
}

const features = [
  {
    icon: Clock,
    title: '7/24 Online Randevu',
    desc: 'Müşterileriniz dilediği zaman randevu alsın.'
  },
  {
    icon: Users,
    title: 'Akıllı Müşteri Takibi',
    desc: 'Otomatik hatırlatma ve tekrar kazandırma.'
  },
  {
    icon: Shield,
    title: 'Güvenli ve Hızlı',
    desc: 'Verileriniz şifreli, sunucular hızlı.'
  }
]

export default function LoginPage() {
  return (
    <div className="min-h-screen flex">
      {/* Left: Hero Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800">
        {/* Dot Grid Overlay */}
        <div className="absolute inset-0 bg-dot-pattern opacity-[0.08]" />

        {/* Floating Orbs */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-32 right-16 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-primary-200 text-xs font-medium mb-8 backdrop-blur-sm border border-white/10">
              <Sparkles className="w-3.5 h-3.5" />
              Randevu Yönetiminin Geleceği
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              İşletmenizi<br />
              <span className="text-primary-300">Akıllı Randevu</span> ile<br />
              büyütün
            </h1>

            <p className="text-primary-200/80 text-lg max-w-md mb-10 leading-relaxed">
              Berber, kuaför, güzellik salonu veya kliniğinizi tek platformdan yönetin. AI destekli hatırlatmalar ile randevu kaçırma oranınızı %80 azaltın.
            </p>

            <div className="space-y-5">
              {features.map((feature, i) => (
                <div 
                  key={feature.title}
                  className="flex items-start gap-4 group animate-slide-up" 
                  style={{ animationDelay: `${0.2 + i * 0.15}s`, animationFillMode: 'both' }}
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors duration-300 backdrop-blur-sm border border-white/10">
                    <feature.icon className="w-5 h-5 text-primary-300" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold text-sm">{feature.title}</h3>
                    <p className="text-primary-300/70 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-neutral-50">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 animate-fade-in">
            <Link href="/" className="inline-flex items-center gap-1 text-3xl font-bold">
              <span className="text-gradient">Randevu</span>
              <span className="text-neutral-900">AI</span>
            </Link>
            <h2 className="mt-6 text-2xl font-bold text-neutral-900">
              Hesabınıza giriş yapın
            </h2>
            <p className="mt-2 text-neutral-500 text-sm">
              Henüz hesabınız yok mu?{' '}
              <Link href="/register" className="text-primary-600 hover:text-primary-500 font-semibold transition-colors">
                Hemen kayıt olun
              </Link>
            </p>
          </div>

          <div className="glass-card p-8">
            <Suspense fallback={
              <div className="space-y-4">
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-4 w-1/3 mx-auto" />
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-12 w-full" />
                <div className="skeleton h-12 w-full" />
              </div>
            }>
              <LoginForm />
            </Suspense>
          </div>

          <p className="text-center text-xs text-neutral-400 mt-6">
            Giriş yaparak{' '}
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
