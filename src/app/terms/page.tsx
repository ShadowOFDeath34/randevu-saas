import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kullanım Koşulları - RandevuAI",
  description: "RandevuAI kullanım koşulları ve hizmet sözleşmesi",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Kullanım Koşulları</h1>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Sözleşmenin Tarafları</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu Kullanım Koşulları, RandevuAI (&quot;Hizmet Sağlayıcı&quot;) ile platformu kullanan
                işletmeler ve müşteriler (&quot;Kullanıcı&quot;) arasında yapılan elektronik sözleşmenin
                şartlarını belirler. Platformu kullanarak bu koşulları kabul etmiş sayılırsınız.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Hizmet Tanımı</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                RandevuAI, hizmet işletmeleri için randevu yönetim sistemi sunan bir
                SaaS (Software as a Service) platformudur. Sunulan hizmetler:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Online randevu oluşturma ve yönetimi</li>
                <li>Müşteri veritabanı yönetimi</li>
                <li>SMS ve e-posta bildirimleri</li>
                <li>Raporlama ve analiz araçları</li>
                <li>Personel yönetimi</li>
                <li>Hizmet kataloğu yönetimi</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Hesap Oluşturma ve Güvenlik</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformu kullanmak için bir hesap oluşturmanız gerekir. Hesap güvenliği
                ile ilgili yükümlülükleriniz:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Doğru ve güncel bilgiler sağlamak</li>
                <li>Şifrenizi güvenli tutmak ve üçüncü kişilerle paylaşmamak</li>
                <li>Hesabınızda yapılan tüm işlemlerden sorumlu olmak</li>
                <li>Yetkisiz erişimi derhal bildirmek</li>
                <li>18 yaşından büyük olmak veya veli izni almak</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Ödeme ve Abonelik</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                RandevuAI kullanımı aylık/ yıllık abonelik modeli ile çalışır:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Ücretler, seçilen pakete göre faturalandırılır</li>
                <li>Ödemeler peşin olarak tahsil edilir</li>
                <li>İptal talebi bir sonraki dönem başında geçerli olur</li>
                <li>Ödenmeyen faturalar hesabın askıya alınmasına neden olur</li>
                <li>Fiyat değişiklikleri 30 gün önceden bildirilir</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Kullanım Kuralları</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Platformu kullanırken aşağıdaki kurallara uymanız gerekir:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Yasalara ve düzenlemelere uygun hareket etmek</li>
                <li>Başkalarının haklarını ihlal etmemek</li>
                <li>Platformu kötüye kullanmamak (spam, bot, vb.)</li>
                <li>Yanlış veya yanıltıcı bilgi vermemek</li>
                <li>Güvenlik önlemlerini atlatmaya çalışmamak</li>
                <li>Veri madenciliği veya kazıma yapmak yasaktır</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Fikri Mülkiyet</h2>
              <p className="text-gray-600 leading-relaxed">
                RandevuAI&apos;nin tüm içeriği, tasarımı, kodu ve markaları fikri mülkiyet
                koruması altındadır. Kullanıcılar, platformu yalnızca hizmet almak için
                kullanabilir; tersine mühendislik yapamaz, kopyalayamaz veya dağıtamazlar.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Veri ve Gizlilik</h2>
              <p className="text-gray-600 leading-relaxed">
                Kullanıcı verilerinin işlenmesi{' '}
                <a href="/privacy" className="text-blue-600 hover:underline">
                  Gizlilik Politikamız
                </a>{' '}
                ve{' '}
                <a href="/kvkk/aydinlatma" className="text-blue-600 hover:underline">
                  KVKK Aydınlatma Metnimiz
                </a>{' '}
                kapsamında yapılır. İşletmeler, müşteri verilerini yasal çerçevede
                işlemekle yükümlüdür.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Sorumluluk Sınırlaması</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                RandevuAI, aşağıdaki durumlarda sorumlu tutulamaz:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Force majeure (doğal afet, savaş, vb.) durumları</li>
                <li>Kullanıcının kendi hatalı kullanımı</li>
                <li>Üçüncü taraf hizmetlerin (SMS, e-posta) arızaları</li>
                <li>Planlı bakım çalışmaları</li>
                <li>Veri kaybı (yedekleme sorumluluğu kullanıcıya aittir)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Hesap Sonlandırma</h2>
              <p className="text-gray-600 leading-relaxed">
                RandevuAI, kullanım koşullarının ihlali durumunda hesabı askıya alma
                veya sonlandırma hakkını saklı tutar. Kullanıcı da istediği zaman
                hesabını kapatabilir. Hesap kapatma sonrası veriler 30 gün içinde
                silinir (yasal yükümlülükler gereği bazı veriler saklanabilir).
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Uyuşmazlık Çözümü</h2>
              <p className="text-gray-600 leading-relaxed">
                Bu sözleşmeden doğan uyuşmazlıklarda Türkiye Cumhuriyeti kanunları
                uygulanır. Taraflar, uyuşmazlıkları öncelikle dostane yollarla çözmeye
                çalışacaktır. Çözülemeyen durumlarda İstanbul Mahkemeleri ve İcra
                Daireleri yetkilidir.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Kullanım koşulları hakkında sorularınız için{' '}
                <a href="mailto:legal@randevuai.com" className="text-blue-600 hover:underline">
                  legal@randevuai.com
                </a>{' '}
                adresine e-posta gönderebilirsiniz.
              </p>

              <p className="text-gray-500 text-sm mt-4">
                Son güncelleme: {new Date().toLocaleDateString('tr-TR')}
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
