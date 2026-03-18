import { Metadata } from "next";

export const metadata: Metadata = {
  title: "KVKK Aydınlatma Metni - RandevuAI",
  description: "Kişisel Verilerin Korunması Kanunu kapsamında aydınlatma metni",
};

export default function KVKKAydinlatmaPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 md:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Kişisel Verilerin Korunması Aydınlatma Metni
          </h1>

          <div className="prose prose-blue max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                1. Veri Sorumlusu
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Bu aydınlatma metni, 6698 sayılı Kişisel Verilerin Korunması Kanunu (&quot;KVKK&quot;)
                uyarınca, RandevuAI olarak kişisel verilerinizin işlenmesi hakkında sizi
                bilgilendirmek amacıyla hazırlanmıştır.
              </p>
              <div className="mt-4 bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-700">
                  <strong>Veri Sorumlusu:</strong> RandevuAI<br />
                  <strong>Adres:</strong> [İşletme Adresi]<br />
                  <strong>E-posta:</strong> kvkk@randevuai.com<br />
                  <strong>Telefon:</strong> [İletişim Numarası]
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                2. İşlenen Kişisel Veriler
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Aşağıdaki kişisel verileriniz işlenmektedir:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Kimlik bilgileri (ad, soyad)</li>
                <li>İletişim bilgileri (telefon numarası, e-posta adresi)</li>
                <li>Randevu ve işlem bilgileri</li>
                <li>Çerez ve kullanım verileri</li>
                <li>Ödeme bilgileri (gerekli durumlarda)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                3. Kişisel Verilerin İşlenme Amaçları
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                Kişisel verileriniz aşağıdaki amaçlarla işlenmektedir:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Randevu oluşturma ve yönetimi</li>
                <li>Hizmet sunumu ve müşteri ilişkileri yönetimi</li>
                <li>Randevu hatırlatmaları gönderimi</li>
                <li>Yasal yükümlülüklerin yerine getirilmesi</li>
                <li>Güvenlik ve denetim faaliyetleri</li>
                <li>Hizmet kalitesinin artırılması</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                4. Kişisel Verilerin Aktarılması
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Kişisel verileriniz, yasal yükümlülükler kapsamında yetkili kamu kurum ve
                kuruluşlarına, hizmet sağlayıcılarımıza (SMS, e-posta servis sağlayıcıları)
                ve yasal mercilere aktarılabilir. Verileriniz yurt dışına aktarılmamaktadır.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                5. Kişisel Veri Sahibinin Hakları
              </h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                KVKK&apos;nın 11. maddesi uyarınca aşağıdaki haklara sahipsiniz:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
                <li>Kişisel verileriniz işlenmişse buna ilişkin bilgi talep etme</li>
                <li>Kişisel verilerinizin işlenme amacını ve bunların amacına uygun kullanılıp kullanılmadığını öğrenme</li>
                <li>Yurt içinde veya yurt dışında kişisel verilerinizin aktarıldığı üçüncü kişileri bilme</li>
                <li>Kişisel verilerinizin eksik veya yanlış işlenmiş olması halinde bunların düzeltilmesini isteme</li>
                <li>Kişisel verilerinizin silinmesini veya yok edilmesini isteme</li>
                <li>İşlenen verilerinizin münhasıran otomatik sistemler vasıtasıyla analiz edilmesi suretiyle aleyhinize bir sonucun ortaya çıkmasına itiraz etme</li>
                <li>Kişisel verilerinizin kanuna aykırı işlenmesi sebebiyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                6. Başvuru Yöntemi
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Haklarınızı kullanmak için{" "}
                <a href="/kvkk/basvuru" className="text-blue-600 hover:underline">
                  Başvuru Formu
                </a>{" "}
                sayfamızdan veya kvkk@randevuai.com e-posta adresine başvurabilirsiniz.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                7. Güncellemeler
              </h2>
              <p className="text-gray-600 leading-relaxed">
                Bu aydınlatma metni, yasal düzenlemeler ve uygulamalarımızdaki değişiklikler
                doğrultusunda güncellenebilir. Güncel versiyonu web sitemizde yayınlanmaktadır.
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
