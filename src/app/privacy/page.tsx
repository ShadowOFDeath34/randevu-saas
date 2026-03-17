import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Gizlilik Politikası - RandevuAI",
  description: "RandevuAI gizlilik politikası ve veri koruma ilkeleri",
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Gizlilik Politikası</h1>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Giriş</h2>
              <p className="text-gray-600 leading-relaxed">
                RandevuAI olarak, kullanıcılarımızın gizliliğini korumayı taahhüt ediyoruz.
                Bu Gizlilik Politikası, hizmetlerimizi kullanırken toplanan, kullanılan ve
                korunan kişisel verileriniz hakkında bilgi vermektedir.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Toplanan Veriler</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Aşağıdaki türde kişisel veriler toplanabilir:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Kimlik bilgileri (ad, soyad)</li>
                <li>İletişim bilgileri (e-posta, telefon)</li>
                <li>Randevu ve işlem bilgileri</li>
                <li>Cihaz ve kullanım bilgileri</li>
                <li>Çerez ve benzeri teknolojiler aracılığıyla toplanan veriler</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Veri Kullanımı</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kişisel verileriniz aşağıdaki amaçlarla kullanılmaktadır:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Hizmet sağlama ve yönetme</li>
                <li>Müşteri desteği sağlama</li>
                <li>Güvenlik ve dolandırıcılık önleme</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Hizmet iyileştirme ve analiz</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Veri Güvenliği</h2>
              <p className="text-gray-600 leading-relaxed">
                Verilerinizin güvenliği bizim için önemlidir. Veri kaybını, kötüye
                kullanımı veya yetkisiz erişimi önlemek için uygun teknik ve idari
                önlemler alıyoruz. Ancak, internet üzerinden hiçbir veri aktarımının
                %100 güvenli olmadığını lütfen unutmayın.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Haklarınız</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                KVKK kapsamında aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Verilerinize erişim hakkı</li>
                <li>Verilerinizin düzeltilmesini talep etme hakkı</li>
                <li>Verilerinizin silinmesini talep etme hakkı</li>
                <li>İşlemeye itiraz etme hakkı</li>
                <li>Veri taşınabilirliği hakkı</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. İletişim</h2>
              <p className="text-gray-600 leading-relaxed">
                Gizlilik politikamız hakkında sorularınız için{" "}
                <a href="mailto:privacy@randevuai.com" className="text-blue-600 hover:underline">
                  privacy@randevuai.com
                </a>{" "}
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
