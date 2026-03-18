'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, AlertTriangle } from 'lucide-react'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setStatus('error')
      setErrorMessage('Şifreler birbiriyle eşleşmiyor')
      return
    }

    if (password.length < 6) {
      setStatus('error')
      setErrorMessage('Şifreniz en az 6 karakter olmalıdır')
      return
    }

    setLoading(true)
    setStatus('idle')

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password })
      })

      if (res.ok) {
        setStatus('success')
        setTimeout(() => {
          router.push('/login')
        }, 3000)
      } else {
        const data = await res.json()
        setStatus('error')
        setErrorMessage(data.error || 'Token geçersiz veya süresi dolmuş')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="text-center py-6 animate-scale-in">
        <div className="w-16 h-16 bg-red-50 text-danger rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Geçersiz Bağlantı</h3>
        <p className="text-neutral-500 text-sm mb-6">Şifre sıfırlama bağlantısında token eksik.</p>
        <Link href="/forgot-password" className="btn-primary py-2.5 px-5 text-sm">
          Yeni Sıfırlama İstemi
        </Link>
      </div>
    )
  }

  if (status === 'success') {
    return (
      <div className="text-center py-6 animate-scale-in">
        <div className="w-16 h-16 bg-green-50 text-success rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
          <CheckCircle className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Şifreniz Sıfırlandı</h3>
        <p className="text-neutral-500 text-sm">
          Giriş sayfasına yönlendiriliyorsunuz...
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up">
      {status === 'error' && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-scale-in">
          {errorMessage}
        </div>
      )}

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-neutral-600 mb-1.5">
          Yeni Şifre
        </label>
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

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-600 mb-1.5">
          Yeni Şifre (Tekrar)
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
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
        {loading ? 'Sıfırlanıyor...' : 'Şifreyi Güncelle'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-3xl font-bold">
            <span className="text-gradient">Randevu</span>
            <span className="text-neutral-900">AI</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-neutral-900">
            Yeni Şifre Belirleyin
          </h2>
        </div>

        <div className="glass-card p-8">
          <Suspense fallback={
            <div className="space-y-4">
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
              <div className="skeleton h-12 w-full" />
            </div>
          }>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
