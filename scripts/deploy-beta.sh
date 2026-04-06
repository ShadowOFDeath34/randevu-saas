#!/bin/bash

# Beta Deployment Script
# RandevuAI SaaS - Production Beta Launch

set -e

echo "🚀 RandevuAI Beta Deployment"
echo "==============================="
echo ""

# Renk kodları
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Pre-deployment checks
echo "📋 Pre-deployment Checks..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found. Install with: npm i -g vercel${NC}"
    exit 1
fi

# Check if logged in to Vercel
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Not logged in to Vercel. Run: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Vercel CLI ready${NC}"

# TypeScript compilation check
echo "🔍 TypeScript compilation check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ TypeScript compilation passed${NC}"

# Run unit tests
echo "🧪 Running unit tests..."
npm run test:ci
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Unit tests failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ All tests passed${NC}"

# Environment validation
echo "🔐 Validating environment variables..."
npm run env:validate
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Environment validation failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Environment variables validated${NC}"

# Build the application
echo "🏗️ Building application..."
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

echo ""
echo "📦 Ready for deployment!"
echo ""

# Deploy to production
echo "🚀 Deploying to production..."
vercel --prod --yes

# Get deployment URL
DEPLOYMENT_URL=$(vercel ls --meta gitCommit=$(git rev-parse HEAD) | grep -o 'https://[^ ]*' | head -1)

echo ""
echo -e "${GREEN}✅ Deployment successful!${NC}"
echo ""
echo "🔗 Deployment URL: $DEPLOYMENT_URL"
echo ""

# Health check
echo "🏥 Running health check..."
sleep 5

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$DEPLOYMENT_URL/api/health" || echo "000")

if [ "$HEALTH_STATUS" = "200" ]; then
    echo -e "${GREEN}✓ Health check passed${NC}"
    echo ""
    curl -s "$DEPLOYMENT_URL/api/health" | jq .
else
    echo -e "${YELLOW}⚠ Health check returned status: $HEALTH_STATUS${NC}"
    echo "Check deployment logs for details"
fi

echo ""
echo "🎉 Beta deployment complete!"
echo ""
echo "Next steps:"
echo "1. Verify deployment: $DEPLOYMENT_URL"
echo "2. Check logs: vercel logs $DEPLOYMENT_URL"
echo "3. Run smoke tests"
echo "4. Notify beta users"
