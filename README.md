# RandevuAI - Akıllı Randevu Yönetim Platformu

<p align="center">
  <img src="https://img.shields.io/badge/Version-1.0.0-blue" alt="Version">
  <img src="https://img.shields.io/badge/License-Commercial-red" alt="License">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-SQLite-green" alt="Prisma">
</p>

## 📋 Hakkında

RandevuAI, küçük ve orta ölçekli hizmet işletmeleri için geliştirilmiş modern, tam özellikli bir randevu, müşteri takibi ve yönetim SaaS platformudur.

### Hedef Sektörler

- Berber & Kuaför
- Güzellik Salonu & Cilt Bakım
- Diş Kliniği
- Psikolog & Danışman
- Özel Ders & Eğitim
- Tamir & Servis
- ve daha fazlası...

---

## 🚀 Özellikler

### Çekirdek Özellikler

- Online Randevu Sistemi - 7/24 müşteri randevusu
- Akıllı Slot Hesaplama - Çakışma kontrolü ile otomatik
- Çoklu Personel - Her personel için ayrı takvim
- Hizmet Yönetimi - Süre, fiyat, açıklama
- Müşteri Veritabanı - Tüm müşteri bilgileri
- Çalışma Saatleri - Gün bazlı özelleştirilebilir

### Panel Özellikleri

- Dashboard - Anlık istatistikler
- Takvim - Haftalık/günlük görünüm
- Analytics - Gelir, doluluk, performans
- Müşteri Yönetimi - Arama, notlar, geçmiş
- Ayarlar - Profil, saatler, bildirimler

### Ödeme & Abonelik

- iyzico Entegrasyonu - Türk bankaları
- Abonelik Planları - Başlangıç, Standart, Premium
- Fatura Yönetimi - Otomatik fatura

### Bildirim Sistemleri

- E-posta - Resend ile
- SMS - NetGSM ile
- WhatsApp - Twilio ile
- Otomatik Hatırlatmalar - Cron job

### Yapay Zeka

- AI Chatbot - 7/24 müşteri desteği
- Akıllı Yanıtlar - Doğal dil işleme
- Otomatik Öneriler - Hizmet ve zaman önerileri

### SEO & Pazarlama

- Meta Etiketleri - Arama motoru optimizasyonu
- PWA Desteği - Mobil uygulama deneyimi
- Yorum Sistemi - Müşteri geri bildirimi
- Open Graph - Sosyal medya paylaşımı

### Yönetim

- Super Admin Panel - Tüm tenantları yönet
- Tenant Yönetimi - İşletme izleme
- Rol Tabanlı Erişim - Owner, Staff, Admin
- Audit Logları - Tüm işlemler kayıtlı

---

## 🛠️ Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | SQLite (Prisma) |
| Auth | NextAuth v5 |
| State | React Context |
| Forms | React Hook Form + Zod |
| Deployment | Vercel |

---

## 📦 Kurulum

### Gereksinimler

- Node.js 18+
- npm veya yarn

### Adımlar

```bash
# 1. Projeyi klonla
git clone https://github.com/your-repo/randevu-ai.git
cd randevu-ai

# 2. Bağımlılıkları yükle
npm install

# 3. Environment dosyası oluştur
cp .env.example .env

# 4. Database oluştur
npx prisma db push

# 5. Seed verileri yükle (opsiyonel)
npm run db:seed

# 6. Geliştirme sunucusu başlat
npm run dev
```

### Environment Değişkenleri

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# iyzico (Ödeme)
IYZIPAY_API_KEY=""
IYZIPAY_SECRET_KEY=""
IYZIPAY_BASE_URL="https://sandbox-api.iyzico.com"

# Resend (E-posta)
RESEND_API_KEY=""

# NetGSM (SMS)
NETGSM_API_KEY=""
NETGSM_USER=""
NETGSM_PASS=""

# Twilio (WhatsApp)
TWILIO_ACCOUNT_SID=""
TWILIO_AUTH_TOKEN=""
```

---

## 📁 Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/       # Dashboard pages
│   │   ├── dashboard/     # Ana sayfa
│   │   ├── calendar/      # Takvim
│   │   ├── bookings/     # Randevular
│   │   ├── services/      # Hizmetler
│   │   ├── staff/        # Personel
│   │   ├── customers/    # Müşteriler
│   │   ├── settings/    # Ayarlar
│   │   └── analytics/   # İstatistikler
│   ├── api/              # API routes
│   │   ├── auth/         # NextAuth
│   │   ├── bookings/      # Randevu API
│   │   ├── services/     # Hizmet API
│   │   ├── staff/        # Personel API
│   │   ├── customers/    # Müşteri API
│   │   ├── admin/        # Admin API
│   │   ├── ai/           # AI Chat API
│   │   └── public/       # Public API
│   ├── b/[slug]/         # Public booking page
│   ├── admin/            # Super admin
│   └── review/           # Yorum sayfası
├── components/             # React bileşenler
│   └── chat-widget.tsx   # AI Chat
├── lib/                   # Kütüphaneler
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # NextAuth config
│   ├── utils.ts          # Yardımcı fonksiyonlar
│   ├── validations.ts    # Zod şemaları
│   ├── payment/          # Ödeme sistemi
│   ├── notification/    # Bildirim sistemi
│   ├── ai-chat.ts       # AI chat
│   └── plans.ts         # Abonelik planları
└── prisma/               # Database
    ├── schema.prisma     # DB şeması
    └── seed.ts          # Seed verileri
```

---

## 📄 Lisans

Bu proje ticari kullanım için lisanslıdır.

---

## 📞 İletişim

- Website: randevuai.com
- Email: info@randevuai.com

---

<p align="center">© 2026 RandevuAI - Tüm hakları saklıdır.</p>
// Trigger deploy
