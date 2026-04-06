# Database Migration Guide: SQLite → PostgreSQL

## Mevcut Durum

| Çevre | Database | Config |
|-------|----------|--------|
| Development | SQLite | `file:./dev.db` |
| Production | PostgreSQL | `postgresql://...` |

Prisma schema zaten PostgreSQL için yapılandırılmış. Bu migration development ortamını SQLite'dan PostgreSQL'e taşımak için.

## Migration Planı

### Seçenek 1: Supabase (Önerilen - Ücretsiz Tier)

**Avantajlar:**
- Vercel ile native entegrasyon
- Ücretsiz tier: 500MB, 2 projeye kadar
- Otomatik backup
- Connection pooling (PgBouncer)

**Kurulum:**

1. Supabase hesabı aç: https://supabase.com
2. Yeni proje oluştur
3. Database URL al:
   ```
   Settings → Database → Connection String → Node.js
   ```

4. `.env.local`'ı güncelle:
   ```env
   DATABASE_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   DIRECT_URL="postgresql://postgres:password@db.xxx.supabase.co:5432/postgres"
   ```

5. Migration çalıştır:
   ```bash
   npx prisma migrate dev
   ```

### Seçenek 2: Vercel Postgres

**Avantajlar:**
- Vercel içinde yönetim
- Otomatik scaling
- Prisma Accelerate entegrasyonu

**Kurulum:**
1. Vercel Dashboard → Storage → Create Database
2. Connect to existing project
3. Environment variable'ları otomatik alınır

### Seçenek 3: Railway / Render

- Railway.app: $5/ay başlangıç
- Render.com: Ücretsiz tier (uyku modu var)

## Veri Migration (Eğer veri taşınacaksa)

### 1. SQLite'dan Export

```bash
# SQLite veritabanını dışa aktar
sqlite3 dev.db .dump > backup.sql
```

### 2. PostgreSQL'e Import

```bash
# Supabase/PostgreSQL'e aktar
psql $DATABASE_URL < backup.sql
```

### 3. Prisma Migrate ile Schema Sync

```bash
# Production schema'yı oluştur
npx prisma migrate deploy

# Veya development için
npx prisma migrate dev --name init
```

## Connection Pooling (Prisma Accelerate)

Production için Prisma Accelerate kullan:

```env
# .env.production
DATABASE_URL="prisma://accelerate.prisma-data.net/?api_key=xxx"
DIRECT_URL="postgresql://..." # Migration için
```

Kurulum:
```bash
npx prisma accelerate
```

## Backup Stratejisi

### Otomatik Backup (Supabase)
- Günlük automated backup
- Point-in-time recovery (7 gün)

### Manuel Backup
```bash
# Dump al
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Supabase'ten export
supabase db dump -f backup.sql
```

## Development Workflow

### SQLite'dan PostgreSQL'e geçiş

1. **Development .env.local:**
   ```env
   DATABASE_URL="postgresql://localhost:5432/randevuai_dev"
   DIRECT_URL="postgresql://localhost:5432/randevuai_dev"
   ```

2. **Local PostgreSQL Kurulumu:**
   ```bash
   # Windows (WSL veya Docker)
   docker run -d \
     --name postgres-dev \
     -e POSTGRES_PASSWORD=devpassword \
     -e POSTGRES_DB=randevuai_dev \
     -p 5432:5432 \
     postgres:15
   ```

3. **Migration:**
   ```bash
   npx prisma migrate dev
   ```

4. **Seed Data (opsiyonel):**
   ```bash
   npm run db:seed
   ```

## Production Checklist

- [ ] Database connection string doğru
- [ ] Connection pooling aktif (Prisma Accelerate)
- [ ] Backup stratejisi belirlenmiş
- [ ] Migration test edilmiş (`prisma migrate deploy`)
- [ ] Seed data production için güncellenmiş
- [ ] Database indeksleri optimize edilmiş

## Sorun Giderme

| Hata | Çözüm |
|------|-------|
| "SSL connection required" | `sslmode=require` ekle |
| "Connection timeout" | Connection pooling kullan |
| "Migration failed" | `prisma migrate reset` (DİKKAT: veri silinir) |
| "Too many connections" | Connection limit'i artır veya pooling kullan |

## Migration ROLLBACK Planı

Eğer bir şey ters giderse:

1. Vercel deploy'u önceki sürüme geri al
2. Database'i backup'tan restore et
3. DNS/cache temizle

## İletişim

Database sorunları için:
- Supabase Support: support@supabase.io
- Prisma Discord: discord.gg/prisma

