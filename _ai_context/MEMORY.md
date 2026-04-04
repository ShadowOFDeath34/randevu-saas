# Randevu SaaS - Proje Bellek Dizini

> Bu dosya, projede yapılan işlemlerin, kararların ve önemli bilgilerin hızlı erişimini sağlar.
> Son güncelleme: 4 Nisan 2026

---

## 📋 Proje Özeti

**Proje Adı:** Randevu SaaS  
**Teknoloji Stack:** Next.js 16 + React 19 + TypeScript + Prisma + PostgreSQL  
**Aşama:** Faz 4 (Deployment Hazırlığı)  
**Durum:** Build başarılı, deployment'a hazır

---

## 🔗 Bellek Dosyaları

| Dosya | Açıklama |
|-------|----------|
| [00_MASTER_STATE.md](00_MASTER_STATE.md) | Proje genel durumu ve faz bilgisi |
| [Prd.md](Prd.md) | Product Requirements Document (1717 satır) |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | Mimari dokümantasyon ve pattern'ler |
| [AI_INSTRUCTIONS.md](../AI_INSTRUCTIONS.md) | AI davranış kuralları |
| [PROJE_DURUMU.md](../PROJE_DURUMU.md) | Türkçe proje durum raporu |

---

## 🏗️ Mimari Özet

### Teknolojiler
- **Framework:** Next.js 16.1.6 (App Router, Turbopack)
- **Frontend:** React 19.2.3, Tailwind CSS 4, shadcn/ui
- **Backend:** NextAuth v5 (beta.30), JWT Session
- **Database:** Prisma 5.22 + PostgreSQL (SQLite dev)
- **State:** TanStack Query (React Query) v5
- **Validasyon:** Zod
- **Ödeme:** Iyzico
- **Email:** Resend
- **AI:** OpenAI entegrasyonu

### Dizin Yapısı
```
src/
├── app/
│   ├── (dashboard)/      # Dashboard layout grubu
│   │   ├── dashboard/     # Ana dashboard
│   │   ├── bookings/      # Randevu yönetimi
│   │   ├── customers/     # Müşteri yönetimi
│   │   ├── services/      # Hizmet yönetimi
│   │   ├── staff/           # Personel yönetimi
│   │   ├── settings/        # Ayarlar
│   │   ├── analytics/       # Analitik
│   │   └── campaigns/       # Kampanya yönetimi
│   ├── api/               # API routes
│   ├── b/[slug]/          # Public booking sayfası
│   ├── portal/            # Müşteri portalı
│   ├── kiosk/[slug]/      # Kiosk modu
│   └── ...
├── components/          # React bileşenleri
├── hooks/               # Custom hooks (React Query)
├── lib/                 # Utils, auth, db, validations
└── types/               # TypeScript tipleri
```

---

## 🎯 Önemli Pattern'ler

### API Route Pattern
- Her API route'ta `auth()` kontrolü
- `tenantId` filtresi ile multi-tenancy
- Zod validasyonu
- Tutarlı error handling

### React Query Hook Pattern
- `useBookings`, `useCustomers`, `useServices`, `useStaff`
- Cache invalidation stratejileri
- Optimistic updates

### Component Pattern
- Server Components (default)
- Client Components (`'use client'`) interaktif bileşenler için
- Loading states ve Error boundaries

---

## 🔐 Güvenlik

1. **Authentication:** NextAuth.js v5 - JWT tabanlı, 8 saat session
2. **Authorization:** Her API route'ta `tenantId` kontrolü
3. **Input Validation:** Zod ile tüm input validasyonu
4. **SQL Injection:** Prisma ORM parametrik sorgular
5. **Rate Limiting:** Upstash Redis entegrasyonu

---

## 📊 Veritabanı Şeması (Özet)

| Model | Açıklama |
|-------|----------|
| Tenant | İşletme/tenant bilgisi |
| User | Kullanıcı hesapları |
| Staff | Personel bilgileri |
| Service | Hizmetler |
| Customer | Müşteriler |
| Booking | Randevular |
| Campaign | Kampanyalar |
| Subscription | Abonelikler |
| Invoice | Faturalar |
| AuditLog | Denetim logları |

---

## 🚀 Deployment Bilgileri

- **Platform:** Vercel
- **Output:** Standalone
- **Node.js:** 20.x
- **Database:** PostgreSQL (Neon/Railway)

### Ortam Değişkenleri
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `OPENAI_API_KEY`
- `IYZIPAY_API_KEY`
- `IYZIPAY_SECRET_KEY`

---

## 🧪 Test

- **Unit Tests:** Vitest
- **E2E Tests:** Playwright
- **Coverage:** Istanbul (c8)

---

## 📝 Notlar

- Faz 1 (QA) tamamlandı
- Faz 2 (UI/UX) tamamlandı
- Faz 3 (Proaktif Özellikler) tamamlandı
- Faz 4 (Deployment) aktif

---

## ❓ Sık Kullanılan Komutlar

```bash
# Geliştirme
npm run dev

# Build
npm run build

# Test
npm run test

# Database
npx prisma migrate dev
npx prisma db seed
npx prisma studio

# Lint
npm run lint
```
