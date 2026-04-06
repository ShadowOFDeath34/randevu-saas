-- Create LoyaltyTier enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoyaltyTier') THEN
        CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
    END IF;
END $$;

-- CreateEnum
CREATE TYPE "PricingRuleType" AS ENUM ('SURGE_PEAK_HOURS', 'DISCOUNT_OFF_PEAK', 'LAST_MINUTE', 'ADVANCE_BOOKING', 'LOYALTY_BONUS', 'STANDOUT');

-- CreateEnum
CREATE TYPE "PricingAdjustmentType" AS ENUM ('PERCENTAGE_INCREASE', 'PERCENTAGE_DECREASE', 'FIXED_AMOUNT', 'FIXED_PRICE');

-- CreateTable
CREATE TABLE "DynamicPricingConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT false,
    "minAdjustmentPercent" DOUBLE PRECISION NOT NULL DEFAULT -30,
    "maxAdjustmentPercent" DOUBLE PRECISION NOT NULL DEFAULT 50,
    "useAiOptimization" BOOLEAN NOT NULL DEFAULT true,
    "aiModelVersion" TEXT NOT NULL DEFAULT 'v1',
    "lastTrainingDate" TIMESTAMP(3),
    "autoSurgePricing" BOOLEAN NOT NULL DEFAULT true,
    "autoOffPeakDiscount" BOOLEAN NOT NULL DEFAULT true,
    "peakHoursStart" TEXT NOT NULL DEFAULT '17:00',
    "peakHoursEnd" TEXT NOT NULL DEFAULT '20:00',
    "lunchRushStart" TEXT NOT NULL DEFAULT '12:00',
    "lunchRushEnd" TEXT NOT NULL DEFAULT '14:00',
    "highDemandThreshold" INTEGER NOT NULL DEFAULT 80,
    "lowDemandThreshold" INTEGER NOT NULL DEFAULT 30,
    "lastMinuteHours" INTEGER NOT NULL DEFAULT 24,
    "advanceBookingDays" INTEGER NOT NULL DEFAULT 7,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicPricingConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicPricingRule" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ruleType" "PricingRuleType" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "adjustmentType" "PricingAdjustmentType" NOT NULL,
    "adjustmentValue" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "daysOfWeek" INTEGER[],
    "startTime" TEXT,
    "endTime" TEXT,
    "minOccupancy" INTEGER,
    "maxOccupancy" INTEGER,
    "serviceIds" TEXT[],
    "staffIds" TEXT[],
    "minLoyaltyTier" "LoyaltyTier",
    "maxUsesPerDay" INTEGER,
    "maxUsesPerWeek" INTEGER,
    "totalUseCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DynamicPricingRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ServicePriceHistory" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "basePrice" DOUBLE PRECISION NOT NULL,
    "adjustedPrice" DOUBLE PRECISION NOT NULL,
    "adjustmentReason" TEXT,
    "appliedRules" TEXT[],
    "bookingDate" TEXT,
    "startTime" TEXT,
    "occupancyRate" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServicePriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingAnalytics" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "hour" INTEGER NOT NULL,
    "totalBookings" INTEGER NOT NULL DEFAULT 0,
    "totalRevenue" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "avgPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "occupancyRate" INTEGER NOT NULL DEFAULT 0,
    "aiRecommendedPrice" DOUBLE PRECISION,
    "priceElasticity" DOUBLE PRECISION,
    "demandScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricingAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DynamicPricingConfig_tenantId_key" ON "DynamicPricingConfig"("tenantId");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_tenantId_isActive_idx" ON "DynamicPricingRule"("tenantId", "isActive");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_tenantId_ruleType_idx" ON "DynamicPricingRule"("tenantId", "ruleType");

-- CreateIndex
CREATE INDEX "DynamicPricingRule_tenantId_priority_idx" ON "DynamicPricingRule"("tenantId", "priority");

-- CreateIndex
CREATE INDEX "ServicePriceHistory_tenantId_serviceId_createdAt_idx" ON "ServicePriceHistory"("tenantId", "serviceId", "createdAt");

-- CreateIndex
CREATE INDEX "ServicePriceHistory_tenantId_bookingDate_idx" ON "ServicePriceHistory"("tenantId", "bookingDate");

-- CreateIndex
CREATE INDEX "PricingAnalytics_tenantId_date_idx" ON "PricingAnalytics"("tenantId", "date");

-- CreateIndex
CREATE INDEX "PricingAnalytics_tenantId_date_hour_idx" ON "PricingAnalytics"("tenantId", "date", "hour");

-- CreateIndex
CREATE UNIQUE INDEX "PricingAnalytics_tenantId_date_hour_key" ON "PricingAnalytics"("tenantId", "date", "hour");

-- AddForeignKey
ALTER TABLE "DynamicPricingConfig" ADD CONSTRAINT "DynamicPricingConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicPricingRule" ADD CONSTRAINT "DynamicPricingRule_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePriceHistory" ADD CONSTRAINT "ServicePriceHistory_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ServicePriceHistory" ADD CONSTRAINT "ServicePriceHistory_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingAnalytics" ADD CONSTRAINT "PricingAnalytics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
