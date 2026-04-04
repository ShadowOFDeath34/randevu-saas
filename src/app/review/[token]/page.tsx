'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Star, Building2, Calendar, Clock, User, CheckCircle, Loader2 } from 'lucide-react'

interface ReviewRequestData {
  id: string
  businessName: string
  logoUrl?: string | null
  customerName: string
  serviceName: string
  staffName?: string
  bookingDate: string
  bookingTime: string
}

export default function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const router = useRouter()
  const [token, setToken] = useState<string>('')
  const [reviewData, setReviewData] = useState<ReviewRequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    // Resolve params
    params.then(p => {
      setToken(p.token)
      fetchReviewData(p.token)
    })
  }, [params])

  const fetchReviewData = async (t: string) => {
    try {
      const res = await fetch(`/api/public/review-request?token=${t}`)
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Bir hata oluştu')
        return
      }

      setReviewData(data.reviewRequest)
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) return

    setSubmitting(true)
    try {
      const res = await fetch('/api/public/review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, rating, comment }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Gönderim başarısız')
        return
      }

      setSubmitted(true)
    } catch {
      setError('Gönderim hatası')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="flex items-center gap-3 text-neutral-400">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span className="text-sm">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">😕</span>
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Hata</h1>
          <p className="text-neutral-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-sm border border-neutral-200 p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h1 className="text-xl font-semibold text-neutral-900 mb-2">Teşekkürler!</h1>
          <p className="text-neutral-600 mb-6">
            Değerlendirmeniz başarıyla kaydedildi. İşletmemizi tercih ettiğiniz için teşekkür ederiz!
          </p>
          <button
            onClick={() => window.close()}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    )
  }

  if (!reviewData) return null

  return (
    <div className="min-h-screen bg-neutral-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-neutral-200">
            {reviewData.logoUrl ? (
              <Image
                src={reviewData.logoUrl}
                alt={reviewData.businessName}
                width={64}
                height={64}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <Building2 className="w-10 h-10 text-neutral-400" />
            )}
          </div>
          <h1 className="text-xl font-bold text-neutral-900">{reviewData.businessName}</h1>
          <p className="text-sm text-neutral-500 mt-1">Hizmet deneyiminizi değerlendirin</p>
        </div>

        {/* Booking Info Card */}
        <div className="bg-white rounded-xl border border-neutral-200 p-5 mb-6">
          <h2 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-500" />
            Randevu Bilgileri
          </h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Müşteri</p>
                <p className="font-medium text-neutral-900">{reviewData.customerName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Hizmet</p>
                <p className="font-medium text-neutral-900">{reviewData.serviceName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                <Clock className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-neutral-500">Tarih / Saat</p>
                <p className="font-medium text-neutral-900">
                  {new Date(reviewData.bookingDate).toLocaleDateString('tr-TR')} - {reviewData.bookingTime}
                </p>
              </div>
            </div>
            {reviewData.staffName && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center">
                  <User className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500">Personel</p>
                  <p className="font-medium text-neutral-900">{reviewData.staffName}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rating Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-neutral-200 p-5">
          <h2 className="text-lg font-semibold text-neutral-900 mb-6 text-center">
            Deneyiminizi Değerlendirin
          </h2>

          {/* Stars */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <Star
                  className={`w-10 h-10 ${
                    star <= (hoverRating || rating)
                      ? 'text-amber-400 fill-amber-400'
                      : 'text-neutral-200'
                  }`}
                />
              </button>
            ))}
          </div>

          {rating > 0 && (
            <p className="text-center text-sm font-medium text-primary-600 mb-6">
              {rating === 1 && 'Çok Kötü'}
              {rating === 2 && 'Kötü'}
              {rating === 3 && 'Orta'}
              {rating === 4 && 'İyi'}
              {rating === 5 && 'Mükemmel'}
            </p>
          )}

          {/* Comment */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Yorumunuz (İsteğe Bağlı)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hizmet deneyiminiz hakkında kısa bir yorum yazın..."
              className="w-full px-4 py-3 border border-neutral-200 rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              rows={4}
              maxLength={500}
            />
            <p className="text-xs text-neutral-400 mt-1 text-right">
              {comment.length} / 500
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={rating === 0 || submitting}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              'Değerlendirmeyi Gönder'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-xs text-neutral-400 mt-6">
          Değerlendirmeniz onaylandıktan sonra yayınlanacaktır.
        </p>
      </div>
    </div>
  )
}
