-- Create LoyaltyTier enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'LoyaltyTier') THEN
        CREATE TYPE "LoyaltyTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD', 'PLATINUM');
    END IF;
END $$;

-- CreateEnum
CREATE TYPE "LoyaltyTransactionType" AS ENUM ('EARNED_BOOKING', 'EARNED_COMPLETION', 'EARNED_REVIEW', 'EARNED_REFERRAL', 'EARNED_BIRTHDAY', 'EARNED_BONUS', 'REDEEMED_REWARD', 'EXPIRED', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN "loyaltyPoints" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "loyaltyTier" "LoyaltyTier" NOT NULL DEFAULT 'BRONZE';
ALTER TABLE "Customer" ADD COLUMN "totalPointsEarned" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Customer" ADD COLUMN "referralCode" TEXT;
ALTER TABLE "Customer" ADD COLUMN "referredBy" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Customer_referralCode_key" ON "Customer"("referralCode");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_tenantId_referralCode_key" ON "Customer"("tenantId", "referralCode");

-- CreateIndex
CREATE INDEX "Customer_loyaltyTier_idx" ON "Customer"("loyaltyTier");

-- CreateIndex
CREATE INDEX "Customer_loyaltyPoints_idx" ON "Customer"("loyaltyPoints");

-- CreateTable
CREATE TABLE "LoyaltyTransaction" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "type" "LoyaltyTransactionType" NOT NULL,
    "points" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "bookingId" TEXT,
    "expiryDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoyaltyTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Referral" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "referrerId" TEXT NOT NULL,
    "referredId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "pointsAwarded" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Referral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RewardRedemption" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "rewardType" TEXT NOT NULL,
    "pointsCost" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "usedAt" TIMESTAMP(3),
    "expiryDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RewardRedemption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoyaltyConfig" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "pointsPerBooking" INTEGER NOT NULL DEFAULT 10,
    "pointsPerCompletion" INTEGER NOT NULL DEFAULT 50,
    "pointsPerReview" INTEGER NOT NULL DEFAULT 25,
    "pointsPerReferral" INTEGER NOT NULL DEFAULT 100,
    "birthdayBonusPoints" INTEGER NOT NULL DEFAULT 200,
    "silverThreshold" INTEGER NOT NULL DEFAULT 500,
    "goldThreshold" INTEGER NOT NULL DEFAULT 1500,
    "platinumThreshold" INTEGER NOT NULL DEFAULT 3000,
    "pointsExpiryMonths" INTEGER NOT NULL DEFAULT 12,
    "referralEnabled" BOOLEAN NOT NULL DEFAULT true,
    "tierDiscountBronze" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "tierDiscountSilver" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "tierDiscountGold" DOUBLE PRECISION NOT NULL DEFAULT 10,
    "tierDiscountPlatinum" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LoyaltyConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LoyaltyConfig_tenantId_key" ON "LoyaltyConfig"("tenantId");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_customerId_createdAt_idx" ON "LoyaltyTransaction"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_tenantId_createdAt_idx" ON "LoyaltyTransaction"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "LoyaltyTransaction_type_createdAt_idx" ON "LoyaltyTransaction"("type", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Referral_referredId_key" ON "Referral"("referredId");

-- CreateIndex
CREATE INDEX "Referral_referrerId_status_idx" ON "Referral"("referrerId", "status");

-- CreateIndex
CREATE INDEX "Referral_tenantId_createdAt_idx" ON "Referral"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardRedemption_customerId_status_idx" ON "RewardRedemption"("customerId", "status");

-- CreateIndex
CREATE INDEX "RewardRedemption_tenantId_createdAt_idx" ON "RewardRedemption"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "RewardRedemption_status_expiryDate_idx" ON "RewardRedemption"("status", "expiryDate");

-- AddForeignKey
ALTER TABLE "LoyaltyTransaction" ADD CONSTRAINT "LoyaltyTransaction_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referrerId_fkey" FOREIGN KEY ("referrerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Referral" ADD CONSTRAINT "Referral_referredId_fkey" FOREIGN KEY ("referredId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RewardRedemption" ADD CONSTRAINT "RewardRedemption_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoyaltyConfig" ADD CONSTRAINT "LoyaltyConfig_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
