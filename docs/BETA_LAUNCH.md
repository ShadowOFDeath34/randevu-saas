# Beta Launch Dokümantasyonu

## Genel Bakış

Bu doküman RandevuAI SaaS platformunun beta launch sürecini detaylandırır.

**Beta Launch Tarihi:** TBD  
**Beta Kullanıcı Hedefi:** 10-20 pilot işletme  
**Beta Süresi:** 4-6 hafta

---

## Pre-Launch Checklist

### 1. Altyapı Hazırlığı

- [x] Production build başarılı
- [x] TypeScript compilation clean
- [x] Unit testler çalışıyor (49/49 passing)
- [x] Security audit tamamlandı
- [x] Environment variables validasyonu aktif
- [x] Health check endpoint çalışıyor
- [x] Database migration scripts hazır

### 2. Güvenlik

- [x] CSP headers yapılandırıldı
- [x] Rate limiting aktif
- [x] XSS/SQL Injection koruması
- [x] CORS yapılandırması
- [x] API authentication
- [x] Webhook signature verification
- [ ] Production SSL sertifikası (Vercel otomatik)
- [ ] Sentry error tracking (opsiyonel)

### 3. Ödeme Sistemi

- [ ] iyzico sandbox testleri tamamlandı
- [ ] iyzico production credentials alındı
- [ ] Webhook URL yapılandırıldı
- [ ] Test ödeme işlemleri başarılı
- [ ] Abonelik planları aktif

### 4. Bildirim Sistemleri

- [ ] Resend API key alındı
- [ ] Gönderen e-posta domain doğrulandı
- [ ] E-posta şablonları test edildi
- [ ] NetGSM hesabı aktif (opsiyonel)
- [ ] SMS test mesajları gönderildi

### 5. Veritabanı

- [ ] Neon PostgreSQL database oluşturuldu
- [ ] Connection pooling aktif
- [ ] Backup stratejisi belirlendi
- [ ] Migration scripts test edildi

---

## Deployment Adımları

### 1. Vercel Production Deployment

```bash
# 1. Environment variables'ları Vercel'e ekle
vercel env add DATABASE_URL production
vercel env add DIRECT_URL production
vercel env add NEXTAUTH_SECRET production
vercel env add NEXTAUTH_URL production
vercel env add NEXT_PUBLIC_APP_URL production
vercel env add IYZIPAY_API_KEY production
vercel env add IYZIPAY_SECRET_KEY production
vercel env add IYZIPAY_BASE_URL production
vercel env add RESEND_API_KEY production
vercel env add EMAIL_FROM production
vercel env add UPSTASH_REDIS_REST_URL production
vercel env add UPSTASH_REDIS_REST_TOKEN production

# 2. Production build ve deploy
vercel --prod

# 3. Deployment doğrulama
vercel inspect <deployment-url>
```

### 2. Database Migration

```bash
# Production database'e migrate uygula
npx prisma migrate deploy

# Veya Vercel CLI üzerinden
vercel env pull .env.production
npx prisma migrate deploy
```

### 3. Health Check

```bash
# Health endpoint kontrolü
curl https://your-domain.com/api/health

# Beklenen yanıt:
# {
#   "status": "ok",
#   "timestamp": "2026-04-06T...",
#   "version": "0.1.0",
#   "environment": "production",
#   "checks": {
#     "database": { "status": "healthy", "responseTime": 50 },
#     "memory": { "status": "healthy", "responseTime": 128 },
#     "environment": { "status": "healthy" }
#   }
# }
```

---

## Beta Kullanıcı Onboarding

### 1. Beta Kullanıcı Kriterleri

- Yerel işletmeler (İstanbul öncelikli)
- Haftada en az 20 randevu
- Teknik bilgisi orta düzeyde
- Geri bildirim vermeye istekli
- Minimum 1 ay kullanım taahhüdü

### 2. Onboarding Süreci

```
Gün 1:   Beta kullanıcı kaydı + Tenant oluşturma
Gün 2:   Kickoff call (30 dk) - Kurulum ve eğitim
Gün 3-7:  Aktif kullanım ve destek
Hafta 2: İlk check-in call
Hafta 4: Beta değerlendirme toplantısı
```

### 3. Beta Kullanıcı Avantajları

- 3 ay ücretsiz kullanım
- Ömür boyu %50 indirim
- Öncelikli destek
- Yeni özelliklere erken erişim
- Founder badge

---

## Monitoring ve Alerting

### 1. Temel Metrikler

| Metrik | Hedef | Kritik Eşik |
|--------|-------|-------------|
| Uptime | >99.9% | <99% |
| API Response Time | <500ms | >2000ms |
| Error Rate | <0.1% | >1% |
| Database Connections | <80% | >95% |
| Memory Usage | <70% | >90% |

### 2. Health Check Endpoint

```bash
# Otomatik monitoring için
curl -f https://your-domain.com/api/health || echo "ALERT: Health check failed"
```

### 3. Log Monitoring

```bash
# Vercel logs
vercel logs <deployment-url> --level error

# Real-time log takibi
vercel logs <deployment-url> --follow
```

---

## Rollback Planı

### Otomatik Rollback Tetikleyicileri

1. Error rate > 5% (5 dakika içinde)
2. Health check 3 kez başarısız
3. API response time > 5 saniye
4. Database connection hatası

### Manuel Rollback

```bash
# Önceki deployment'a geri dön
vercel rollback

# Veya belirli bir deployment'a
vercel rollback <deployment-id>
```

---

## Beta Sonrası Roadmap

### Week 1-2: Stabilizasyon

- [ ] Bug fixes
- [ ] Performans optimizasyonları
- [ ] Kullanıcı geri bildirimleri entegrasyonu

### Week 3-4: Feature Polish

- [ ] UI/UX iyileştirmeleri
- [ ] Ekstra dashboard widget'ları
- [ ] Mobil optimizasyon

### Week 5-6: Public Launch Prep

- [ ] Marketing site güncellemeleri
- [ ] Dokümantasyon tamamlama
- [ ] Sales pipeline kurulumu

---

## İletişim ve Destek

### Beta Destek Kanalları

- **E-posta:** beta@randevuai.com
- **WhatsApp:** +90 XXX XXX XX XX
- **In-app Chat:** Sağ alt köşe chat widget
- **Emergency:** 7/24 telefon hattı

### Geri Bildirim Toplama

- Haftalık NPS anketi
- In-app feedback widget
- Monthly beta kullanıcı toplantısı
- Feature request board

---

## Acil Durum Kontakları

| Rol | İsim | Telefon | E-posta |
|-----|------|---------|---------|
| Teknik Lead | Enes | - | enes@randevuai.com |
| Müşteri Destek | TBD | - | support@randevuai.com |
| İş Geliştirme | Enes | - | enes@randevuai.com |

---

**Son Güncelleme:** 2026-04-06  
**Doküman Versiyonu:** 1.0.0
