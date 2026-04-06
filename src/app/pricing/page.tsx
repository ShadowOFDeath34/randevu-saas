import type { Metadata } from 'next'
import Link from 'next/link'
import { Check, X } from 'lucide-react'
import { plans, getYearlyPrice } from '@/lib/plans'

export const metadata: Metadata = {
  title: 'Fiyatlandırma',
  description: 'RandevuAI fiyat planları — Ücretsiz başlayın, işletmeniz büyüdükçe yükseltin. Berber, kuaför ve güzellik salonu işletmeleri için uygun planlar.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Randevu<span className="text-gray-900">AI</span>
              </Link>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <Link href="/#ozellikler" className="text-gray-600 hover:text-gray-900">Özellikler</Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900">Fiyatlandırma</Link>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Giriş Yap
              </Link>
              <Link href="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700">
                Ücretsiz Dene
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Basit, şeffaf fiyatlandırma
            </h1>
            <p className="text-xl text-gray-600">
              İhtiyacınıza göre seçin. İstediğiniz zaman upgrade edin.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-2xl border-2 ${
                  plan.isPopular
                    ? 'border-indigo-600 shadow-xl relative'
                    : 'border-gray-200'
                }`}
              >
                {plan.isPopular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    En Popüler
                  </div>
                )}

                <div className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">{plan.price}₺</span>
                    <span className="text-gray-500">/ay</span>
                  </div>

                  <div className="mb-6 text-sm text-gray-500">
                    Yıllık: <span className="font-semibold text-gray-900">{getYearlyPrice(plan.price)}₺</span> (2 ay bedava!)
                  </div>

                  <Link
                    href={`/register?plan=${plan.id}`}
                    aria-label={`${plan.name} planı ile ${plan.price === 0 ? 'ücretsiz başla' : 'şimdi başla'}`}
                    className={`block w-full py-3 text-center rounded-lg font-medium mb-8 ${
                      plan.isPopular
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                        : 'border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50'
                    }`}
                  >
                    {plan.price === 0 ? 'Ücretsiz Başla' : 'Şimdi Başla'}
                  </Link>

                  <div className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-3">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 flex-shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Özel kurumsal çözümler mi lazım?
            </h2>
            <p className="text-gray-600 mb-6">
              50+ personel, özel entegrasyonlar, dedike sunucu için bizimle iletişime geçin.
            </p>
            <a
              href="mailto:kurumsal@randevuai.com"
              className="inline-block border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-medium hover:border-indigo-600 hover:text-indigo-600"
            >
              Kurumsal Teklif Al
            </a>
          </div>

          <div className="mt-20">
            <h2 className="text-2xl font-bold text-center text-gray-900 mb-12">
              Sıkça Sorulan Sorular
            </h2>

            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Deneme süresi var mı?
                </h3>
                <p className="text-gray-600">
                  Evet! 14 gün ücretsiz deneme süresi sunuyoruz. Kredi kartı gerekmez.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Plan değişikliği yapabilir miyim?
                </h3>
                <p className="text-gray-600">
                  Evet, istediğiniz zaman planınızı yükseltebilir veya düşürebilirsiniz.
                  Yükseltme anında, düşürme ise sonraki fatura döneminde geçerli olur.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Ödeme yöntemleri neler?
                </h3>
                <p className="text-gray-600">
                  Tüm Türk banka kartları, kredi kartları, Kapıda nakit ödeme ve banka havalesi kabul ediyoruz.
                </p>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">
                  İptal edersem ne olur?
                </h3>
                <p className="text-gray-600">
                  İstediğiniz zaman iptal edebilirsiniz. Kullanmadığınız günlerin ücreti iade edilir.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-gray-400">
            © 2026 RandevuAI. Tüm hakları saklıdır.
          </p>
        </div>
      </footer>
    </div>
  )
}
