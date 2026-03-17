# 🚀 FAZ 4: DEPLOYMENT (CANLIYA ALMA)

> **HEDEF:** Sıfır hata ile üretim ortamına çıkış yapmak. "Patron: Canlıya almak için zerre kadar gerekçe kalmadı" diyene kadar burası boş bekleyecek.

## 🛑 CHECKLIST (DEV/PROD GEÇİŞİ)
- [ ] Tüm `.env` değişkenleri Vercel ortamına hatasız aktarıldı mı?
- [ ] SQLite dev veritabanından, Production veritabanı sağlayıcısına (Turso / Supabase / Neon vs.) geçiş yapıldı mı?
- [ ] Prisma migration'ları Production'da yetkilendirme ile hatasız koşuldu mu?
- [ ] İyzico Sandbox modundan Canlı (Live) moda alındı mı?
- [ ] Twilio / NetGSM / Resend limitleri ve webhook url'leri Production domainine güncellendi mi?

## 🔑 GÜVENLİK
- [ ] Super Admin sayfalarına yetkisiz erişim sızma testleri yapıldı mı?
- [ ] CSRF, XSS korumaları aktif mi?
- [ ] Tenant A'nın kullanıcıları, Tenant B'nin randevularını görebiliyor mu? (Veritabanı izolasyonu penetration test)
