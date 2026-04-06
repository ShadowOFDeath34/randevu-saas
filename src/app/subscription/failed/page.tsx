import Link from 'next/link'
import { XCircle, RefreshCw, HelpCircle } from 'lucide-react'

export default function SubscriptionFailedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ödeme İşlemi Başarısız
        </h1>

        <p className="text-gray-600 mb-6">
          Ödeme işleminiz tamamlanamadı. Lütfen bilgilerinizi kontrol edip tekrar deneyin.
        </p>

        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
            <HelpCircle className="w-4 h-4" />
            Sık karşılaşılan nedenler:
          </h3>
          <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
            <li>Yetersiz bakiye</li>
            <li>Kart limiti aşımı</li>
            <li>Banka tarafından reddedilme</li>
            <li>Geçersiz kart bilgileri</li>
            <li>3D Secure doğrulama hatası</li>
          </ul>
        </div>

        <div className="space-y-3">
          <Link
            href="/subscription"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <RefreshCw className="w-5 h-5" />
            Tekrar Dene
          </Link>

          <a
            href="mailto:destek@randevuai.com"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Destek Al
          </a>
        </div>
      </div>

      <p className="mt-8 text-sm text-gray-500">
        <Link href="/" className="hover:text-gray-700">
          ← Ana Sayfa
        </Link>
      </p>
    </div>
  )
}
