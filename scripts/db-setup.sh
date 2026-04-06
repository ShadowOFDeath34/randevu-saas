#!/bin/bash
# Database Setup Script
# SQLite'dan PostgreSQL'e geçiş için

set -e

echo "🗄️  RandevuAI Database Setup"
echo "============================"

# Renkler
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Docker PostgreSQL başlat
echo -e "${YELLOW}Docker PostgreSQL başlatılıyor...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker bulunamadı. Lütfen Docker kurun.${NC}"
    exit 1
fi

# PostgreSQL container'ı çalışıyor mu?
if docker ps | grep -q "postgres-randevu"; then
    echo -e "${GREEN}✅ PostgreSQL zaten çalışıyor${NC}"
else
    echo "PostgreSQL container'ı başlatılıyor..."
    docker run -d \
        --name postgres-randevu \
        -e POSTGRES_USER=randevu \
        -e POSTGRES_PASSWORD=devpassword \
        -e POSTGRES_DB=randevuai_dev \
        -p 5432:5432 \
        postgres:15-alpine 2>/dev/null || docker start postgres-randevu

    echo -e "${GREEN}✅ PostgreSQL başlatıldı${NC}"
    echo "⏳ Bağlantı bekleniyor..."
    sleep 3
fi

# .env.local güncelleme
echo -e "\n${YELLOW}.env.local dosyası güncelleniyor...${NC}"

ENV_CONTENT='# PostgreSQL (Local Development)
DATABASE_URL="postgresql://randevu:devpassword@localhost:5432/randevuai_dev"
DIRECT_URL="postgresql://randevu:devpassword@localhost:5432/randevuai_dev"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="dev-secret-key-min-32-chars-long-change-in-production"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# iyzico (Sandbox)
IYZIPAY_API_KEY="sandbox-api-key"
IYZIPAY_SECRET_KEY="sandbox-secret-key"
IYZIPAY_BASE_URL="https://sandbox-api.iyzico.com"
'

if [ -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local zaten var. Yedeği alınıyor...${NC}"
    cp .env.local ".env.local.backup.$(date +%Y%m%d_%H%M%S)"
fi

echo "$ENV_CONTENT" > .env.local

echo -e "${GREEN}✅ .env.local oluşturuldu${NC}"

# Prisma migrate
echo -e "\n${YELLOW}Prisma migrate çalıştırılıyor...${NC}"
npx prisma migrate dev --name init || echo -e "${YELLOW}⚠️  Migration zaten mevcut${NC}"

# Prisma generate
echo -e "\n${YELLOW}Prisma Client generate ediliyor...${NC}"
npx prisma generate

echo -e "\n${GREEN}✅ Database setup tamamlandı!${NC}"
echo ""
echo "Sonraki adımlar:"
echo "  1. npm run dev (uygulamayı başlat)"
echo "  2. npx prisma studio (database GUI)"
echo "  3. npm run db:seed (örnek veri ekle)"
echo ""
echo "PostgreSQL bağlantı bilgileri:"
echo "  Host: localhost:5432"
echo "  Database: randevuai_dev"
echo "  User: randevu"
echo "  Password: devpassword"
