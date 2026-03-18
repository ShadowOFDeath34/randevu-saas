# Randevu SaaS - Proje Durumu

> Bu dosya context sorunlarını önlemek için sürekli güncel tutulmalıdır.
> Son güncelleme: 2026-03-18

## Proje Özeti

Next.js 16 + Prisma + PostgreSQL + React Query + shadcn/ui ile geliştirilmiş randevu yönetim sistemi.

## Son Yapılan İşlemler (2026-03-18)

### TypeScript Build Hataları Düzeltildi

1. **ZodError Tip Dönüşümleri** - `error as unknown as { errors: { message: string }[] }` pattern'i uygulandı:
   - `src/app/api/services/[id]/route.ts` (satır 36)
   - `src/app/api/staff/route.ts` (satır 56)
   - `src/app/api/staff/[id]/route.ts` (satır 48)
   - `src/app/api/services/route.ts` (satır 45)
   - `src/app/api/register/route.ts` (satır 45)

2. **BookingStatus Enum** - Prisma'dan import edilip tip dönüşümü yapıldı:
   - `src/app/api/bookings/route.ts`: `filter as BookingStatus`

3. **Payment Result Tipi** - Explicit type cast eklendi:
   - `src/app/api/payments/route.ts`: `result` değişkenine `{ status?: string; paymentStatus?: string; ... }` tipi atandı

4. **Webhook Body Tipi** - `Record<string, unknown>` destructuring sorunu çözüldü:
   - `src/app/api/webhooks/iyzico/route.ts`: Explicit type annotation eklendi

5. **Customer State Tipi** - `fullName` yerine `name` kullanımı düzeltildi:
   - `src/app/portal/page.tsx`: State tipi `{ name: string }` olduğu için `customer?.name` kullanıldı

### ESLint Hataları Düzeltildi

Toplam 40+ dosyada düzeltme yapıldı:
- `any` tipi kaldırılıp `unknown` veya spesifik tipler kullanıldı
- Kullanılmayan importlar temizlendi
- `_` prefix ile intentionally unused değişkenler işaretlendi
- React escape entities (&apos;, &quot;) eklendi
- Next.js Link component kullanımı düzeltildi
- `react-hooks/set-state-in-effect` disable comment eklendi

### Test Güncellemeleri

API yanıt yapısı değiştiği için testler güncellendi:
- `src/app/api/customers/route.test.ts`: Pagination yapısı eklendi
- `src/app/api/bookings/route.test.ts`: Count mock'u eklendi

## Mevcut Durum

### Build Durumu
```
✓ npm run build - BAŞARILI
✓ npm run lint - BAŞARILI (sadece uyarılar, hata yok)
✓ npm test - BAŞARILI (46/46 test geçiyor)
```

### Kalan Uyarılar (35 adet)
- Çoğunluğu kullanılmayan değişken uyarıları
- React Hook dependency uyarıları
- Kritik hata yok, sadece code style uyarıları

## Proje Yapısı

```
src/
├── app/                    # Next.js App Router
│   ├── (dashboard)/        # Dashboard layout group
│   ├── api/                # API Routes
│   ├── b/[slug]/           # Public booking page
│   ├── kiosk/[slug]/       # Kiosk mode
│   ├── portal/             # Customer portal
│   └── ...
├── components/             # React components
├── hooks/                  # Custom React Query hooks
├── lib/                    # Utilities, auth, db
├── types/                  # TypeScript types
└── __tests__/             # Test files
```

## Önemli Dosyalar

### Tip Güvenliği
- `src/lib/validations.ts` - Zod şemaları
- `prisma/schema.prisma` - Database şeması

### API Routes
- `src/app/api/bookings/route.ts` - Booking CRUD
- `src/app/api/customers/route.ts` - Customer CRUD
- `src/app/api/services/route.ts` - Service CRUD
- `src/app/api/staff/route.ts` - Staff CRUD

### Hooks
- `src/hooks/use-bookings.ts` - Booking queries
- `src/hooks/use-customers.ts` - Customer queries
- `src/hooks/use-services.ts` - Service queries
- `src/hooks/use-staff.ts` - Staff queries

## Sık Karşılaşılan Hatalar ve Çözümleri

### 1. ZodError Tip Dönüşümü
```typescript
// YANLIŞ
const zodError = error as { errors: { message: string }[] }

// DOĞRU
const zodError = error as unknown as { errors: { message: string }[] }
```

### 2. Prisma Enum Kullanımı
```typescript
// BookingStatus enum'ını import et
import { BookingStatus } from '@prisma/client'

// Tip dönüşümü yap
where.status = filter as BookingStatus
```

### 3. Record<string, unknown> Destructuring
```typescript
// Explicit type annotation gerekli
const { field } = body as { field?: string }
```

### 4. Test Mock Pattern
```typescript
// Mock tip dönüşümü
;(auth as unknown as { mockResolvedValueOnce: (value: T) => void }).mockResolvedValueOnce(mockSession)
```

## Komutlar

```bash
# Development
npm run dev

# Build
npm run build

# Lint
npm run lint

# Test
npm test

# Database
npx prisma migrate dev
npx prisma generate
npx prisma studio
```

## Ortam Değişkenleri

Gerekli environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `NEXTAUTH_SECRET` - JWT secret
- `NEXTAUTH_URL` - App URL
- `NEXT_PUBLIC_APP_URL` - Public URL
- `IYZICO_API_KEY` / `IYZICO_SECRET_KEY` - Payment
- `OPENAI_API_KEY` - AI features
- `RESEND_API_KEY` - Email
- `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` - Rate limiting

## Yapılacaklar (Backlog)

1. Kalan 35 lint uyarısını temizle
2. React Hook dependency uyarılarını çöz
3. Test coverage'ı artır (şu an 46 test)
4. E2E testler ekle (Playwright)
5. Performance optimizasyonları
6. Accessibility (a11y) iyileştirmeleri

## Notlar

- Next.js 16 kullanılıyor (Turbopack default)
- React Query v5 kullanılıyor
- Prisma ORM kullanılıyor
- shadcn/ui component library kullanılıyor
- TypeScript strict mode aktif
