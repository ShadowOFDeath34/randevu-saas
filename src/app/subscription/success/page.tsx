import Link from 'next/link'
import { CheckCircle, ArrowRight, Home } from 'lucide-react'

export default function SubscriptionSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ödemeniz Başarıyla Alındı!
        </h1>

        <p className="text-gray-600 mb-6">
          Aboneliğiniz aktif hale getirildi. Artık tüm özellikleri kullanabilirsiniz.
        </p>

        <div className="space-y-3">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
          >
            <Home className="w-5 h-5" />
            Panele Git
          </Link>

          <Link
            href="/subscription"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Abonelik Detayları
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-sm text-gray-500">
            Sorunuz mu var?{' '}
            <a href="mailto:destek@randevuai.com" className="text-indigo-600 hover:text-indigo-700">
              Destek ekibimize ulaşın
            </a>
          </p>
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
