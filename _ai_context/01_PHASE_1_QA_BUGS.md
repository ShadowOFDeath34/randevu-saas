# 🐛 FAZ 1: QA & BUG HUNTING KONTROL LİSTESİ

> **HEDEF:** Sistemde "tek bir virgül bile" hata kalmayacak. Her form, her buton, her API endpoint'i test edilecek.

## 🛑 BİLİNEN HATALAR / BUG'LAR (LOG)
- [*Henüz testlere başlanmadı. Manuel veya otomatik testlerle buralar dolacak.*]

## 🛠️ TEST EDİLECEK MODÜLLER VE DURUMLARI

### 1. Kimlik Doğrulama (Auth)
- [x] Kayıt olma (Tüm edge case'ler, geçersiz email, kısa şifre): İncelendi ve Düzeltildi. (Türkçe karakter koruması ve validasyon eklendi)
- [x] Giriş yapma (Yanlış şifre, kilitlenen hesap durumları): İncelendi ve Düzeltildi. (Pasif kullanıcıların logini reddedildi, çift hata mesajı kaldırıldı)
- [x] Şifre sıfırlama (Email gönderimi ve token doğrulama): FAZ 1.5 EKLENTİSİ YAPILDI. (Kullanıcı veritabanına token/expiry eklendi, endpoint ve UI yazıldı)
- [ ] NextAuth Session kalıcılığı ve sayfa yenileme testleri

### 2. İşletme ve Profil Yönetimi
- [ ] İşletme saatleri ve timezone varyasyonları
- [ ] Tatil günleri ekleme/çıkarma (Geçmişe/Geleceğe dönük)
- [x] Dosya/Logo yükleme kısıtlamaları (Boyut, format): İNCELENDİ VE DİZELTİLDİ. (Backend API tarafına 3MB Base64 string limiti koyuldu. Veritabanının şişirilmesi engellendi)

### 3. Hizmet ve Personel (Staff & Services)
- [x] Personel silindiğinde randevularının (soft delete/cascade) durumu: İNCELENDİ VE DÜZELTİLDİ. (Personel silme işleminden önce "Aktif Booking var mı?" kontrolü API'ye eklendi.)
- [x] Hizmet süresi değiştiğinde geçmiş randevuların etkilenmemesi: API hizmetleri ilişkisel olarak güncellemiyor, mevcut randevular `duration` hesaplamasını o anlık kopya üzerinden aldığı için sorun yok.
- [x] Personel-hizmet ilişkisi koparıldığında takvim davranışları: İNCELENDİ VE DÜZELTİLDİ. (Hizmet tarafında da aktif Booking bağımlılık kontrolü kodlandı.)

### 4. Randevu ve Takvim Motoru (Core Engine)
- [x] Çakışma kontrolü testleri (Concurrency test - aynı saniyede iki kişi randevu alırsa?): İNCELENDİ VE DÜZELTİLDİ. (Prisma `$transaction` ve Serializable izolasyon eklendi)
- [x] Geçmişe dönük randevu alınmasını engelleme (Zaman yolculuğu açığı): İNCELENDİ VE DÜZELTİLDİ. (Server-side date validasyonu ve slot generation'da saat filtresi eklendi)
- [x] Tampon süre (Buffer time) hesaplamaları hatasız mı?: Mevcut mantık, personelin çalışma saatlerine ve randevu çakışmalarına göre dinamik olarak hesaplıyor. İşlevsel görünüyor.
- [x] Tatil günlerine veya mesai dışı saatlere randevu alma engelleri aktif mi?: İNCELENDİ. API, `businessHours` ve `staffWorkingHours` tablolarındaki `isClosed` bayraklarına ve saat aralıklarına göre çalışıyor. Düzenli doğrulandı.

### 5. Veritabanı ve Routing İzolasyonu (Security)
- [x] Tüm tablolara (user, staff, service) `tenantId` eklendi mi? İNCELENDİ. (Tüm modellerde ilişkili mevcut)
- [x] Cross-tenant veri okuma riski (A işletmesi B'nin datalarını görebilir mi?): İNCELENDİ. Middleware yetkilendirmesi devrede. API rotalarında oturum sahibinin `tenantId` filtrelemesi ile sorgular (where clause) izole edilmiş.
- [x] Sadece süper adminlerin gireceği rotalar ve auth kontrolleri: İNCELENDİ. Middleware `/admin` dizinini koruyor.

### 6. Bildirimler ve Ödeme (Notifications & Payments)
- [x] Asenkron mesaj/email gönderim hataları uygulamanın çökmesine yol açıyor mu?: İNCELENDİ. Gönderimler `try-catch` içinde yapılıyor ve `NotificationLog` olarak veritabanına sadece durumu (success/failed) yazılıyor. Ancak await edildiği için toplu mesajlarda API'yi yavaşlatabilir. İlerleyen fazlarda background job (Örn: Inngest/BullMQ) eklenebilir. Şu anlık crash yaratmıyor.
- [x] iyzico entegrasyonu webhook'ları doğru dinleniyor mu? (Timeout durumları): İNCELENDİ VE YAZILDI. (Payment callback'leri dinleyen `/api/webhooks/iyzico` endpoint'i yazılarak asenkron durumlarda database üzerinde booking status `paid` yapacak senaryo ayağa kaldırıldı.)

