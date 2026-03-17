# RandevuAI - Deployment Rehberi

## Hızlı Başlangıç (Vercel)

### 1. Vercel Hesabı Oluştur
- https://vercel.com adresine git
- GitHub hesabınla giriş yap
- "New Project" butonuna tıkla

### 2. Projeyi Deploy Et
```bash
# GitHub'a yükle
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/USERNAME/randevu-saas.git
git push -u origin main
```

Vercel'de:
1. "Import Project" -> GitHub repository'sini seç
2. Framework Preset: Next.js
3. Build Command: `prisma generate && npm run build`
4. Environment Variables ekle (aşağıda)

### 3. Environment Variables

Vercel'de Settings -> Environment Variables:

```
DATABASE_URL="file:./dev.db"
NEXTAUTH_URL="https://randevuai.vercel.app"
NEXTAUTH_SECRET="[openssl rand -base64 32 ile oluştur]"
NEXT_PUBLIC_APP_URL="https://randevuai.vercel.app"

# OAuth (Google Console'dan al)
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# iyzico (sandbox için)
IZIPAY_API_KEY="sandbox-api-key"
IZIPAY_SECRET_KEY="sandbox-secret-key"
IZIPAY_BASE_URL="https://sandbox-api.iyzico.com"
```

### 4. Domain Ayarla
- Settings -> Domains
- Domainini ekle (örn: randevuai.com)
- DNS ayarlarını yap

---

## Veritabanı (Vercel Postgres)

### Seçenek 1: Vercel Postgres (Önerilen)
```bash
# Vercel CLI ile
npm i -g vercel
vercel link
vercel env add DATABASE_URL
```

### Seçenek 2: Neon / Supabase
- Neon.io veya Supabase'den ücretsiz PostgreSQL al
- Connection string'i DATABASE_URL olarak kullan

### Veritabanı Migrasyonu
```bash
npx prisma db push
# veya
npx prisma migrate dev --name init
```

---

## Ödeme Entegrasyonu (iyzico)

### Sandbox (Test)
1. https://sandbox.iyzico.com adresine git
2. Hesap oluştur
3. API key'leri al
4. `.env` dosyasına ekle

### Production
1. https://merchant.iyzico.com adresine başvur
2. KYC onayı bekle
3. Canlı API key'leri al
4. `IZIPAY_BASE_URL` değerini `https://api.iyzico.com` olarak değiştir

---

## E-posta (Resend)

### Kurulum
1. https://resend.com adresine git
2. API key oluştr
3. Domain doğrula (SPF, DKIM, DMARC)

### Template
```bash
RESEND_API_KEY="re_xxx"
EMAIL_FROM="onay@send.randevuai.com"
```

---

## SMS (NetGSM)

### Kurulum
1. https://www.netgsm.com.tr adresine git
2. Üye ol, SMS paketi al
3. API bilgilerini al

---

## WhatsApp (Twilio)

### Kurulum
1. https://www.twilio.com adresine git
2. WhatsApp Business API etkinleştir
3. Account SID ve Auth Token al

---

## Sorun Giderme

### "Prisma Client not generated"
```bash
npx prisma generate
```

### "Too many connections"
- Connection pooling kullan
- Vercel Postgres otomatik pooling sağlar

### "Session error"
- NEXTAUTH_SECRET'i yeniden oluştur
- NEXTAUTH_URL'i doğrula

---

## Production Checklist

- [ ] Domain alındı
- [ ] SSL aktif
- [ ] Database migration yapıldı
- [ ] Environment variables ayarlandı
- [ ] iyzico sandbox test edildi
- [ ] E-posta gönderimi test edildi
- [ ] Landing page SEO kontrol edildi
