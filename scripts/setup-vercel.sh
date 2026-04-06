#!/bin/bash
# Vercel Projesi Kurulum Scripti

set -e

echo "🚀 RandevuAI Vercel Setup"
echo "=========================="

# Vercel CLI kurulu mu kontrol et
if ! command -v vercel &> /dev/null; then
    echo "📦 Vercel CLI kuruluyor..."
    npm install -g vercel
fi

# Login kontrolü
echo "🔐 Vercel hesabına giriş yapılıyor..."
vercel whoami || vercel login

# Proje linkleme
echo "🔗 Proje linkleniyor..."
vercel link

echo "✅ Kurulum tamamlandı!"
echo ""
echo "Sonraki adımlar:"
echo "1. .vercel/project.json'dan ORG_ID ve PROJECT_ID al"
echo "2. GitHub Secrets'a ekle:"
echo "   - VERCEL_TOKEN"
echo "   - VERCEL_ORG_ID"
echo "   - VERCEL_PROJECT_ID"
echo "3. İlk deploy için: vercel --prod"
