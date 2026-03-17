'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { reportError } from '@/lib/error-reporting'

export default function BookingsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    reportError(error, {
      component: 'BookingsError',
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="p-8">
      <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6 text-amber-600" />
        </div>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Randevular Yüklenemedi
        </h2>

        <p className="text-gray-600 mb-6 text-sm">
          Randevu verileri yüklenirken bir hata oluştu. Lütfen tekrar deneyin.
        </p>

        <Button
          onClick={reset}
          className="flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Tekrar Dene
        </Button>
      </div>
    </div>
  )
}
