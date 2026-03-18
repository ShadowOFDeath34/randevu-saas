'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setStatus('idle')

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (res.ok) {
        setStatus('success')
      } else {
        const data = await res.json()
        setStatus('error')
        setErrorMessage(data.error || 'Bir hata oluştu')
      }
    } catch {
      setStatus('error')
      setErrorMessage('Ağ veya sunucu hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-1 text-3xl font-bold">
            <span className="text-gradient">Randevu</span>
            <span className="text-neutral-900">AI</span>
          </Link>
          <h2 className="mt-6 text-2xl font-bold text-neutral-900">
            Şifremi Unuttum
          </h2>
          <p className="mt-2 text-neutral-500 text-sm">
            Kayıtlı e-posta adresinizi girin, size şifre sıfırlama bağlantısı gönderelim.
          </p>
        </div>

        <div className="glass-card p-8 relative">
          <Link href="/login" className="absolute top-4 left-4 text-neutral-400 hover:text-primary-600 flex items-center gap-1 text-sm font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Geri
          </Link>

          {status === 'success' ? (
            <div className="text-center py-6 animate-scale-in">
              <div className="w-16 h-16 bg-green-50 text-success rounded-2xl flex items-center justify-center mx-auto mb-4 border border-green-100">
                <Mail className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">E-posta Gönderildi</h3>
              <p className="text-neutral-500 text-sm leading-relaxed">
                Eğer sistemimizde <strong className="text-neutral-700">{email}</strong> adresine ait bir hesap varsa, şifre sıfırlama bağlantısı gönderilmiştir.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5 mt-6 animate-slide-up">
              {status === 'error' && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-scale-in">
                  {errorMessage}
                </div>
              )}

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

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 text-sm"
              >
                {loading ? 'Gönderiliyor...' : 'Bağlantı Gönder'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
