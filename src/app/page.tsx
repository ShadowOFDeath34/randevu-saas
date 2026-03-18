import Link from 'next/link'
import {
  Calendar,
  Users,
  Bell,
  Star,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Clock
} from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-indigo-600">Randevu<span className="text-gray-900">AI</span></span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a href="#ozellikler" className="text-gray-600 hover:text-gray-900">Özellikler</a>
              <a href="#fiyatlandirma" className="text-gray-600 hover:text-gray-900">Fiyatlandırma</a>
              <a href="#sss" className="text-gray-600 hover:text-gray-900">SSS</a>
            </nav>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Giriş Yap
              </Link>
              <Link href="/register" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                Ücretsiz Dene
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
              Randevularınızı dijitalleştirin, müşteri kaçırmayın
            </h1>
            <p className="text-xl text-gray-600 mb-10">
              Küçük ve orta ölçekli işletmeler için akıllı randevu ve müşteri yönetimi sistemi. 
              Profesyonel görünüm kazanın, zamandan tasarruf edin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center justify-center gap-2">
                Ücretsiz Başla <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/b/demo-berber" className="border border-gray-300 text-gray-700 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2">
                Demo Gör
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Özellikler */}
      <section id="ozellikler" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Tüm ihtiyaçlarınız tek platformda
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              İşletmenizi dijitalleştirmek için ihtiyacınız olan her şey hazır
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Online Randevu</h3>
              <p className="text-gray-600">
                Müşterileriniz 7/24 online randevu oluşturabilir. Telefonla uğraşmak yerine işinize odaklanın.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Otomatik Hatırlatmalar</h3>
              <p className="text-gray-600">
                Müşterilerinize otomatik hatırlatma gönderin. No-show oranlarınızı minimuma indirin.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Müşteri Takibi</h3>
              <p className="text-gray-600">
                Müşteri geçmişini görün, notlar ekleyin ve tekrar gelen müşterilerinizi takip edin.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Akıllı Takvim</h3>
              <p className="text-gray-600">
                Personel ve hizmet bazlı takvim görünümü. Çakışma olmadan randevu yönetimi.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">İstatistikler</h3>
              <p className="text-gray-600">
                İşletmenizin performansını takip edin. Doluluk oranı, en popüler hizmetler ve daha fazlası.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center mb-6">
                <Star className="w-6 h-6 text-pink-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Yorum Toplama</h3>
              <p className="text-gray-600">
                Randevu sonrası otomatik yorum isteği gönderin. Google yorumlarınızı artırın.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Sektörler */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Her sektöre uygun çözüm
            </h2>
            <p className="text-lg text-gray-600">
              Berberden diş kliniğine, kuaförden psikoloğa kadar her işletme için
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4">
            {['Berber', 'Kuaför', 'Güzellik Salonu', 'Cilt Bakım', 'Diş Kliniği', 'Psikolog', 'Özel Ders', 'Tamir'].map((sektor) => (
              <span key={sektor} className="px-6 py-3 bg-gray-100 text-gray-700 rounded-full font-medium">
                {sektor}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section id="fiyatlandirma" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Basit ve şeffaf fiyatlandırma
            </h2>
            <p className="text-lg text-gray-600">
              İhtiyacınıza göre seçin, işinizi büyüttükçe yükseltin
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Başlangıç</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">199₺</span>
                <span className="text-gray-500">/ay</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> 1 Personel
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Sınırsız randevu
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Online randevu sayfası
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Temel istatistikler
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3 text-center border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                Başla
              </Link>
            </div>

            <div className="bg-indigo-600 p-8 rounded-2xl shadow-lg relative">
              <div className="absolute top-0 right-0 bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg rounded-tr-lg">
                POPÜLER
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Standart</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-white">399₺</span>
                <span className="text-indigo-200">/ay</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300" /> 5 Personel
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300" /> Sınırsız randevu
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300" /> Otomatik hatırlatmalar
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300" /> Yorum isteme
                </li>
                <li className="flex items-center gap-3 text-white">
                  <CheckCircle className="w-5 h-5 text-indigo-300" /> Gelişmiş raporlar
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3 text-center bg-white text-indigo-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                Başla
              </Link>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200">
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Premium</h3>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-900">799₺</span>
                <span className="text-gray-500">/ay</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Sınırsız personel
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Çoklu şube
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> AI asistan
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Özel domain
                </li>
                <li className="flex items-center gap-3 text-gray-600">
                  <CheckCircle className="w-5 h-5 text-green-500" /> Öncelik destek
                </li>
              </ul>
              <Link href="/register" className="block w-full py-3 text-center border border-indigo-600 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors">
                Başla
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            Hemen başlayın, rakiplerinizden önde olun
          </h2>
          <p className="text-lg text-gray-600 mb-10">
            14 gün ücretsiz deneme. Kredi kartı gerekmez.
          </p>
          <Link href="/register" className="bg-indigo-600 text-white px-10 py-4 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2">
            Ücretsiz Hesap Oluştur <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <span className="text-2xl font-bold">Randevu<span className="text-indigo-400">AI</span></span>
              <p className="mt-4 text-gray-400">
                Küçük işletmeler için akıllı randevu yönetimi
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Ürün</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Özellikler</a></li>
                <li><a href="#" className="hover:text-white">Fiyatlandırma</a></li>
                <li><a href="#" className="hover:text-white">Demo</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Şirket</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Hakkımızda</a></li>
                <li><a href="#" className="hover:text-white">İletişim</a></li>
                <li><a href="#" className="hover:text-white">Kariyer</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Yasal</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white">Gizlilik</a></li>
                <li><a href="#" className="hover:text-white">Kullanım Şartları</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
            © 2026 RandevuAI. Tüm hakları saklıdır.
          </div>
        </div>
      </footer>
    </div>
  )
}
