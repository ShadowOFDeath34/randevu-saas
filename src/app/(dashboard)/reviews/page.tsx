'use client'

import { useState } from 'react'
// Custom hooks kullanılıyor, react-query importları gerekli değil
import { Star, MessageSquare, Eye, CheckCircle, XCircle, EyeOff, Calendar, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useReviews, usePublishReview } from '@/hooks/use-reviews'

interface ReviewRequest {
  id: string
  bookingId: string
  customerId: string
  customer: {
    fullName: string
    phone: string
  }
  booking: {
    service: { name: string }
    bookingDate: string
    startTime: string
  }
  rating: number | null
  comment: string | null
  status: string
  isPublished: boolean
  requestedAt: string
  publishedAt: string | null
}

export default function ReviewsPage() {
  const { toast } = useToast()
  const [selectedReview, setSelectedReview] = useState<ReviewRequest | null>(null)

  const { data, isLoading } = useReviews()

  const publishMutation = usePublishReview()

  const reviews = data?.reviews || []
  const stats = data?.stats || { total: 0, published: 0, pending: 0, averageRating: 0 }

  const handlePublish = (id: string, isPublished: boolean) => {
    publishMutation.mutate(
      { id, isPublished },
      {
        onSuccess: () => {
          toast({ title: 'Başarılı', description: 'Değerlendirme güncellendi', variant: 'success' })
          setSelectedReview(null)
        },
        onError: () => {
          toast({ title: 'Hata', description: 'İşlem sırasında hata oluştu', variant: 'destructive' })
        }
      }
    )
  }

  const renderStars = (rating: number | null) => {
    if (!rating) return <span className="text-neutral-400 text-sm">Değerlendirme yok</span>
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}`}
          />
        ))}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 flex items-center gap-2">
            <Star className="w-6 h-6 text-amber-500" />
            Müşteri Değerlendirmeleri
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Müşterilerinizden gelen yorumları yönetin ve yayınlayın
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Toplam Değerlendirme</p>
          <p className="text-2xl font-bold text-neutral-900 mt-1">{stats.total}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Ortalama Puan</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold text-neutral-900">{stats.averageRating.toFixed(1)}</span>
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Yayında</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.published}</p>
        </div>
        <div className="bg-white p-5 rounded-xl border border-neutral-200">
          <p className="text-sm text-neutral-500">Bekleyen</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 border-b border-neutral-100">
                <th className="p-4 pl-6 text-xs font-semibold text-neutral-500 uppercase">Müşteri</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase">Hizmet</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase">Puan</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase">Yorum</th>
                <th className="p-4 text-xs font-semibold text-neutral-500 uppercase">Durum</th>
                <th className="p-4 pr-6 text-right text-xs font-semibold text-neutral-500 uppercase">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {reviews.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <Star className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="text-neutral-900 font-medium">Henüz değerlendirme yok</p>
                    <p className="text-sm text-neutral-500 mt-1">
                      Müşteriler randevu tamamlandıktan sonra değerlendirme yapabilir
                    </p>
                  </td>
                </tr>
              ) : (
                reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-neutral-50/50 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
                          {review.customer.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-neutral-900 text-sm">{review.customer.fullName}</p>
                          <p className="text-xs text-neutral-500">{review.customer.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-neutral-700">{review.booking.service.name}</p>
                      <p className="text-xs text-neutral-400">{review.booking.bookingDate} {review.booking.startTime}</p>
                    </td>
                    <td className="p-4">
                      {renderStars(review.rating)}
                    </td>
                    <td className="p-4">
                      {review.comment ? (
                        <p className="text-sm text-neutral-700 max-w-xs truncate">{review.comment}</p>
                      ) : (
                        <span className="text-sm text-neutral-400">Yorum yok</span>
                      )}
                    </td>
                    <td className="p-4">
                      {review.isPublished ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Yayında
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">
                          <EyeOff className="w-3.5 h-3.5" />
                          Bekliyor
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => setSelectedReview(review)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Görüntüle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 modal-overlay flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full mx-4 overflow-hidden">
            <div className="p-6 border-b border-neutral-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">Değerlendirme Detayı</h3>
                <button
                  onClick={() => setSelectedReview(null)}
                  className="text-neutral-400 hover:text-neutral-600"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-lg">
                  {selectedReview.customer.fullName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-neutral-900">{selectedReview.customer.fullName}</p>
                  <p className="text-sm text-neutral-500">{selectedReview.customer.phone}</p>
                </div>
              </div>

              <div className="bg-neutral-50 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-600">{selectedReview.booking.bookingDate} {selectedReview.booking.startTime}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-neutral-400" />
                  <span className="text-neutral-600">{selectedReview.booking.service.name}</span>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Puan</p>
                <div className="flex items-center gap-2">
                  {renderStars(selectedReview.rating)}
                  {selectedReview.rating && (
                    <span className="text-lg font-bold text-neutral-900">{selectedReview.rating}/5</span>
                  )}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-neutral-600 mb-2">Yorum</p>
                {selectedReview.comment ? (
                  <div className="bg-neutral-50 rounded-lg p-4">
                    <p className="text-sm text-neutral-700 whitespace-pre-wrap">{selectedReview.comment}</p>
                  </div>
                ) : (
                  <p className="text-sm text-neutral-400">Yorum bırakılmamış</p>
                )}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <MessageSquare className="w-4 h-4 text-neutral-400" />
                <span className="text-xs text-neutral-500">
                  Talep: {new Date(selectedReview.requestedAt).toLocaleDateString('tr-TR')}
                </span>
              </div>
            </div>

            <div className="px-6 py-4 bg-neutral-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setSelectedReview(null)}
              >
                Kapat
              </Button>
              {!selectedReview.isPublished ? (
                <Button
                  onClick={() => handlePublish(selectedReview.id, true)}
                  disabled={publishMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Yayınla
                </Button>
              ) : (
                <Button
                  onClick={() => handlePublish(selectedReview.id, false)}
                  disabled={publishMutation.isPending}
                  variant="outline"
                  className="text-amber-600 border-amber-600 hover:bg-amber-50"
                >
                  <EyeOff className="w-4 h-4 mr-2" />
                  Yayından Kaldır
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
