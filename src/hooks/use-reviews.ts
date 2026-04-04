import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

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

interface ReviewStats {
  total: number
  published: number
  pending: number
  averageRating: number
}

export function useReviews() {
  return useQuery<{ reviews: ReviewRequest[]; stats: ReviewStats }>({
    queryKey: ['reviews'],
    queryFn: async () => {
      const res = await fetch('/api/reviews')
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'Değerlendirmeler yüklenemedi')
      }
      return res.json()
    }
  })
}

export function usePublishReview() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, isPublished }: { id: string; isPublished: boolean }) => {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isPublished })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.message || 'İşlem başarısız')
      }

      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] })
    }
  })
}
