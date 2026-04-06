# RandevuAI - Güvenlik ve Secrets Yönetimi

## Secrets Rotation Politikası

### Zorunlu Rotation Zamanları

| Secret | Rotation Periyodu | Son Rotation |
|--------|-------------------|--------------|
| NEXTAUTH_SECRET | Her 90 gün | 2026-04-06 |
| DATABASE_URL şifresi | Her 180 gün | - |
| IYZIPAY API Key | Yılda 1 kez | - |
| RESEND_API_KEY | Yılda 1 kez | - |
| SENTRY_AUTH_TOKEN | İhtiyaç halinde | - |

### Acil Rotation Gerektiren Durumlar

1. **Anında Değiştir**:
   - Herhangi bir secret'ın yanlışlıkla açığa çıkması (log, GitHub, chat)
   - Eski çalışan/contractor ayrılığı
   - Şüpheli güvenlik ihlali
   - Bilinmeyen IP'den anormal API kullanımı

2. **24 Saat İçinde Değiştir**:
   - Birden fazla başarısız login denemesi
   - Sentry'de şüpheli hata pattern'i

### Rotation Adımları

1. Yeni secret'ı üret (yerel makinede, güvenli ortamda)
2. Vercel Dashboard'da yeni değeri ekle
3. Uygulamayı redeploy et
4. Eski secret'ı Vercel'den sil
5. Bu dokümanı güncelle

## Environment Variable Doğrulama

### Local Development

```bash
# .env.local dosyasını doğrula
npm run env:validate
```

### Production Deploy Öncesi

```bash
# Vercel environment'larını kontrol et
npx vercel env ls

# Production için özel kontrol
npm run env:validate:production
```

## Güvenlik Checklist

- [ ] `.env*.local` `.gitignore`'da
- [ ] `NEXTAUTH_SECRET` en az 32 karakter
- [ ] `DATABASE_URL` production'da şifreli bağlantı
- [ ] Tüm API key'ler sandbox/live ayrımı yapıyor
- [ ] CORS origins whitelist olarak tanımlı
- [ ] Rate limiting aktif

## İletişim

Güvenlik ihlali şüphesi: `security@randevuai.com`

