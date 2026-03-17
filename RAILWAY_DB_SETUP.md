# Railway PostgreSQL Kurulumu

## 1. Railway Hesabı Oluştur
- https://railway.app adresine git
- GitHub hesabınla giriş yap

## 2. PostgreSQL Database Oluştur
- "New Project" butonuna tıkla
- "Provision PostgreSQL" seçeneğini seç
- Database otomatik oluşturulacak

## 3. Connection String Al
- Database'e tıkla
- "Connect" sekmesine git
- "Public URL" veya "Private URL" kopyala

## 4. Vercel'e Ekle
```bash
vercel env add DATABASE_URL production
# Railway connection string'i yapıştır

vercel env add DIRECT_URL production
# Aynı connection string'i yapıştır
```

## 5. Database Migration Çalıştır
```bash
npx prisma migrate deploy
```

## Not
Railway ücretsiz tier'da:
- 500 saat/ay kullanım limiti
- Uyku modu (bir süre kullanılmazsa)
- Production için yeterli başlangıçta

Daha sonra Neon veya Supabase'e geçilebilir.
