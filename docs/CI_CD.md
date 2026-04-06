# RandevuAI - CI/CD Dokümantasyonu

## Workflows

### 1. CI (`ci.yml`)
Her push ve PR'da çalışır:
- ✅ TypeScript derleme (tsc --noEmit)
- ✅ ESLint kontrolü
- ✅ Build testi
- ✅ Unit testler
- ✅ Environment variable validasyonu

### 2. CD (`cd.yml`)
Main branch'e push yapıldığında:
- 🚀 Production deploy (Vercel)
- 🏷️ Otomatik release tag oluşturma
- 📢 Discord webhook bildirimi

### 3. Preview (`preview.yml`)
Her PR'da çalışır:
- 🔗 Preview URL oluşturur
- 💬 PR'ye yorum olarak preview linki atar

### 4. Security (`security.yml`)
- 🔒 npm audit (high severity+)
- 🔑 Secret leak taraması (TruffleHog)
- ⏰ Her Pazartesi otomatik

## Gerekli Secrets

GitHub Secrets ayarlarında şunları tanımla:

| Secret | Nereden Alınır | Ne İçin |
|--------|---------------|---------|
| `VERCEL_TOKEN` | Vercel Dashboard → Settings → Tokens | Deploy yetkisi |
| `VERCEL_ORG_ID` | `.vercel/project.json` içinde | Organizasyon ID |
| `VERCEL_PROJECT_ID` | `.vercel/project.json` içinde | Proje ID |
| `DISCORD_WEBHOOK_URL` | Discord → Server Settings → Integrations | Deploy bildirimleri |

## Deploy Stratejisi

```
PR açıldığında:
  → Preview Deploy oluştur
  → Test çalıştır
  → Sonuç PR'de göster

PR merge edildiğinde:
  → CI testlerini çalıştır
  → Production deploy
  → Discord bildirim
  → Tag oluştur
```

## Manuel Deploy

```bash
# Preview
git checkout feature-branch
vercel

# Production
git checkout main
vercel --prod

# Veya CI/CD'de rollback için:
vercel rollback
```

## Branch Protection Kuralları

1. `main` branch için:
   - Require PR before merging
   - Require status checks (CI, build)
   - Require up-to-date branch
   - Restrict pushes (sadece maintainers)

2. `develop` branch için:
   - PR required
   - CI must pass

## Build Cache

CI pipeline şunları cache'ler:
- `node_modules` (package-lock.json'a göre)
- Vercel CLI

## Troubleshooting

| Hata | Çözüm |
|------|-------|
| "VERCEL_TOKEN not found" | GitHub Secrets'a ekle |
| "Cannot find project" | `vercel link` çalıştır |
| Build timeout | Vercel limitlerini kontrol et |
| Preview URL çalışmıyor | Vercel Dashboard'dan kontrol et |

