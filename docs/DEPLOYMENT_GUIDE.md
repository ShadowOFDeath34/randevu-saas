# Deployment Guide

## Özet

Bu rehber RandevuAI SaaS platformunun Vercel üzerinde production deployment sürecini açıklar.

---

## Ön Gereksinimler

### Gerekli Araçlar

- Node.js 20+
- npm 10+
- Vercel CLI: `npm i -g vercel`
- Git

### Hesaplar

- Vercel hesabı (vercel.com)
- Neon PostgreSQL hesabı (neon.tech)
- iyzico merchant hesabı
- Resend hesabı (opsiyonel)
- Upstash Redis (opsiyonel)

---

## 1. İlk Kurulum

### 1.1 Vercel Proje Oluşturma

```bash
# Login
vercel login

# Proje linkleme (mevcut repo'dan)
vercel link

# Yeni proje oluşturma (boştan)
vercel
```

### 1.2 Environment Variables

Vercel Dashboard > Settings > Environment Variables'dan ekle:

**Zorunlu Değişkenler:**

```
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=<openssl rand -base64 32>
NEXTAUTH_URL=https://your-domain.vercel.app
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
IYZIPAY_API_KEY=your-api-key
IYZIPAY_SECRET_KEY=your-secret-key
IYZIPAY_BASE_URL=https://sandbox-api.iyzico.com
```

**Önerilen Değişkenler:**

```
RESEND_API_KEY=re_...
EMAIL_FROM=onay@your-domain.com
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
SENTRY_DSN=https://...
```

### 1.3 Database Kurulumu

```bash
# Neon PostgreSQL'de database oluştur
# Connection string'i al ve Vercel'e ekle

# Migration uygula
npx prisma migrate deploy

# Seed data (opsiyonel)
npx prisma db seed
```

---

## 2. Deployment İşlemi

### 2.1 Manuel Deployment

```bash
# Production deployment
vercel --prod

# Preview deployment
vercel
```

### 2.2 Git Integration (Otomatik)

1. GitHub repo'sunu Vercel'e bağla
2. Branch ayarlarını yap:
   - Production Branch: `main`
   - Preview Branches: tüm branch'ler

3. Her push otomatik deploy eder:
   - `main` → Production
   - Diğer branch'ler → Preview

### 2.3 Deployment Script

```bash
# Otomatik deployment script
npm run deploy:prod

# Ön izleme deployment
npm run deploy:preview
```

---

## 3. Deployment Doğrulama

### 3.1 Health Check

```bash
# Health endpoint kontrolü
curl https://your-domain.com/api/health

# Detaylı kontrol
npx zx scripts/verify-deployment.mjs
```

### 3.2 Log Kontrolü

```bash
# Real-time logs
vercel logs --follow

# Error logs
vercel logs --level error

# Belirli deployment logs
vercel logs <deployment-url>
```

---

## 4. Domain Yapılandırması

### 4.1 Özel Domain Ekleme

```bash
# Domain ekle
vercel domains add your-domain.com

# DNS kayıtlarını kontrol et
vercel domains inspect your-domain.com
```

### 4.2 SSL Sertifikası

Vercel otomatik SSL sağlar. Ek yapılandırma gerekmez.

---

## 5. Monitoring ve Analytics

### 5.1 Vercel Analytics

Dashboard > Analytics'ten eriş:
- Page views
- Unique visitors
- Core Web Vitals

### 5.2 Sentry Entegrasyonu

```bash
# Sentry DSN ekle
vercel env add SENTRY_DSN

# Otomatik hata raporlama aktif
```

### 5.3 Custom Metrics

```bash
# Build metrics
curl https://your-domain.com/api/metrics

# Database metrics
npx prisma studio
```

---

## 6. Troubleshooting

### 6.1 Build Hataları

**Hata: Prisma generate failed**
```
Çözüm: vercel.json'da buildCommand düzenle
"buildCommand": "prisma generate && next build"
```

**Hata: Environment variable missing**
```
Çözüm: Vercel Dashboard'dan eksik değişkeni ekle
veya: vercel env add VARIABLE_NAME
```

**Hata: Database connection failed**
```
Çözüm: DATABASE_URL formatını kontrol et
postgresql://user:pass@host:port/db?sslmode=require
```

### 6.2 Runtime Hataları

```bash
# Log analizi
vercel logs --since 1h

# Error rate kontrolü
vercel logs --level error --since 24h
```

---

## 7. Güvenlik Kontrol Listesi

- [ ] Tüm secret'lar environment variable olarak tanımlı
- [ ] API routes authentication kontrolü
- [ ] CORS origins whitelist yapılandırıldı
- [ ] Rate limiting aktif
- [ ] Security headers (CSP, HSTS) gönderiliyor
- [ ] SQL Injection koruması
- [ ] XSS koruması

---

## 8. Performans Optimizasyonu

### 8.1 Build Optimizasyonları

```javascript
// next.config.ts
{
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  compiler: {
    removeConsole: true,
  },
}
```

### 8.2 Image Optimization

```javascript
// next.config.ts
{
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
  },
}
```

---

## 9. Backup ve Recovery

### 9.1 Database Backup

```bash
# Neon PostgreSQL'de otomatik backup aktif
# Manuel backup:
pg_dump $DATABASE_URL > backup.sql

# Restore:
psql $DATABASE_URL < backup.sql
```

### 9.2 Deployment Rollback

```bash
# Önceki deployment'a geri dön
vercel rollback

# Belirli deployment'a rollback
vercel rollback <deployment-id>
```

---

## 10. CI/CD Integration

### GitHub Actions

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:ci
      - run: npm run build
      - name: Deploy
        run: vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
```

---

## Hızlı Referans

| Komut | Açıklama |
|-------|----------|
| `vercel` | Preview deployment |
| `vercel --prod` | Production deployment |
| `vercel logs` | Log görüntüleme |
| `vercel env ls` | Environment variables listele |
| `vercel env add NAME` | Environment variable ekle |
| `vercel rollback` | Önceki deployment'a dön |
| `vercel inspect` | Deployment detayları |

---

**Son Güncelleme:** 2026-04-06
