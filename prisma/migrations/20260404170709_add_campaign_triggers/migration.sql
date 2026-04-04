-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('booking_confirmed', 'booking_cancelled', 'booking_no_show', 'booking_completed', 'appointment_reminder_24h', 'appointment_reminder_2h', 'customer_birthday', 'customer_at_risk', 'customer_inactive_30d', 'customer_inactive_60d');

-- CreateEnum
CREATE TYPE "TriggerAction" AS ENUM ('send_sms', 'send_email', 'send_whatsapp', 'send_notification');

-- CreateEnum
CREATE TYPE "TriggerStatus" AS ENUM ('active', 'paused', 'draft');

-- CreateTable
CREATE TABLE "CampaignTrigger" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "triggerType" "TriggerType" NOT NULL,
    "action" "TriggerAction" NOT NULL,
    "templateId" TEXT,
    "conditions" TEXT,
    "delayMinutes" INTEGER NOT NULL DEFAULT 0,
    "status" "TriggerStatus" NOT NULL DEFAULT 'active',
    "lastTriggeredAt" TIMESTAMP(3),
    "triggerCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignTrigger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TriggerExecutionLog" (
    "id" TEXT NOT NULL,
    "triggerId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "customerId" TEXT,
    "bookingId" TEXT,
    "status" TEXT NOT NULL,
    "payload" TEXT,
    "errorMessage" TEXT,
    "executedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TriggerExecutionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CampaignTrigger_tenantId_status_idx" ON "CampaignTrigger"("tenantId", "status");

-- CreateIndex
CREATE INDEX "CampaignTrigger_tenantId_triggerType_idx" ON "CampaignTrigger"("tenantId", "triggerType");

-- CreateIndex
CREATE INDEX "CampaignTrigger_status_triggerType_idx" ON "CampaignTrigger"("status", "triggerType");

-- CreateIndex
CREATE INDEX "CampaignTrigger_tenantId_createdAt_idx" ON "CampaignTrigger"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "TriggerExecutionLog_triggerId_executedAt_idx" ON "TriggerExecutionLog"("triggerId", "executedAt");

-- CreateIndex
CREATE INDEX "TriggerExecutionLog_tenantId_executedAt_idx" ON "TriggerExecutionLog"("tenantId", "executedAt");

-- CreateIndex
CREATE INDEX "TriggerExecutionLog_status_executedAt_idx" ON "TriggerExecutionLog"("status", "executedAt");

-- AddForeignKey
ALTER TABLE "CampaignTrigger" ADD CONSTRAINT "CampaignTrigger_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriggerExecutionLog" ADD CONSTRAINT "TriggerExecutionLog_triggerId_fkey" FOREIGN KEY ("triggerId") REFERENCES "CampaignTrigger"("id") ON DELETE CASCADE ON UPDATE CASCADE;
