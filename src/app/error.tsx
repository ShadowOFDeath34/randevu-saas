'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { reportError } from '@/lib/error-reporting'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Sentry'e hata raporla
    reportError(error, {
      component: 'GlobalError',
      digest: error.digest,
    })
  }, [error])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Bir Şeyler Yanlış Gitti
        </h1>

        <p className="text-gray-600 mb-6">
          Üzgünüz, beklenmedik bir hata oluştu. Lütfen tekrar deneyin veya ana sayfaya dönün.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left">
            <p className="text-xs font-mono text-gray-700 break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Tekrar Dene
          </Button>

          <Button
            variant="outline"
            onClick={() => window.location.href = '/'}
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            Ana Sayfa
          </Button>
        </div>
      </div>
    </div>
  )
}
