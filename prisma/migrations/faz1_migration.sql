-- Faz 1: Güvenlik ve Altyapı Migration SQL
-- Bu dosya Prisma schema değişikliklerini manuel uygulamak için kullanılabilir
-- veya `npx prisma migrate dev` komutu çalıştırılabilir

-- ============================================
-- 1. Booking tablosuna deletedAt alanı ekle (Soft Delete)
-- ============================================
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "deletedAt" TIMESTAMP(3);

-- ============================================
-- 2. VerificationCode tablosu oluştur
-- ============================================
CREATE TABLE IF NOT EXISTS "VerificationCode" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- VerificationCode indexleri
CREATE INDEX IF NOT EXISTS "VerificationCode_phone_idx" ON "VerificationCode"("phone");
CREATE INDEX IF NOT EXISTS "VerificationCode_code_idx" ON "VerificationCode"("code");
CREATE INDEX IF NOT EXISTS "VerificationCode_expiresAt_idx" ON "VerificationCode"("expiresAt");
CREATE INDEX IF NOT EXISTS "VerificationCode_used_idx" ON "VerificationCode"("used");

-- ============================================
-- 3. NotificationLog tablosu (SMS/Email logları için)
-- ============================================
CREATE TABLE IF NOT EXISTS "NotificationLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL, -- sms, email, whatsapp, push
    "channel" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, delivered
    "error" TEXT,
    "metadata" JSONB,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bookingId" TEXT,
    "customerId" TEXT,
    "tenantId" TEXT,
    CONSTRAINT "NotificationLog_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NotificationLog_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "NotificationLog_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- NotificationLog indexleri
CREATE INDEX IF NOT EXISTS "NotificationLog_type_idx" ON "NotificationLog"("type");
CREATE INDEX IF NOT EXISTS "NotificationLog_channel_idx" ON "NotificationLog"("channel");
CREATE INDEX IF NOT EXISTS "NotificationLog_recipient_idx" ON "NotificationLog"("recipient");
CREATE INDEX IF NOT EXISTS "NotificationLog_status_idx" ON "NotificationLog"("status");
CREATE INDEX IF NOT EXISTS "NotificationLog_sentAt_idx" ON "NotificationLog"("sentAt");
CREATE INDEX IF NOT EXISTS "NotificationLog_bookingId_idx" ON "NotificationLog"("bookingId");
CREATE INDEX IF NOT EXISTS "NotificationLog_customerId_idx" ON "NotificationLog"("customerId");
CREATE INDEX IF NOT EXISTS "NotificationLog_tenantId_idx" ON "NotificationLog"("tenantId");

-- ============================================
-- 4. Mevcut tablolara index ekle
-- ============================================

-- Booking indexleri
CREATE INDEX IF NOT EXISTS "Booking_status_idx" ON "Booking"("status");
CREATE INDEX IF NOT EXISTS "Booking_date_idx" ON "Booking"("date");
CREATE INDEX IF NOT EXISTS "Booking_startTime_idx" ON "Booking"("startTime");
CREATE INDEX IF NOT EXISTS "Booking_customerId_idx" ON "Booking"("customerId");
CREATE INDEX IF NOT EXISTS "Booking_serviceId_idx" ON "Booking"("serviceId");
CREATE INDEX IF NOT EXISTS "Booking_staffId_idx" ON "Booking"("staffId");
CREATE INDEX IF NOT EXISTS "Booking_tenantId_idx" ON "Booking"("tenantId");
CREATE INDEX IF NOT EXISTS "Booking_tenantId_date_idx" ON "Booking"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Booking_deletedAt_idx" ON "Booking"("deletedAt");

-- Customer indexleri
CREATE INDEX IF NOT EXISTS "Customer_email_idx" ON "Customer"("email");
CREATE INDEX IF NOT EXISTS "Customer_phone_idx" ON "Customer"("phone");
CREATE INDEX IF NOT EXISTS "Customer_tenantId_idx" ON "Customer"("tenantId");

-- Service indexleri
CREATE INDEX IF NOT EXISTS "Service_tenantId_idx" ON "Service"("tenantId");

-- Staff indexleri
CREATE INDEX IF NOT EXISTS "Staff_tenantId_idx" ON "Staff"("tenantId");

-- User indexleri
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");
CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");

-- Tenant indexleri
CREATE INDEX IF NOT EXISTS "Tenant_slug_idx" ON "Tenant"("slug");

-- Payment indexleri
CREATE INDEX IF NOT EXISTS "Payment_bookingId_idx" ON "Payment"("bookingId");
CREATE INDEX IF NOT EXISTS "Payment_status_idx" ON "Payment"("status");

-- Review indexleri
CREATE INDEX IF NOT EXISTS "Review_bookingId_idx" ON "Review"("bookingId");
CREATE INDEX IF NOT EXISTS "Review_customerId_idx" ON "Review"("customerId");

-- WorkingHours indexleri
CREATE INDEX IF NOT EXISTS "WorkingHours_staffId_idx" ON "WorkingHours"("staffId");
CREATE INDEX IF NOT EXISTS "WorkingHours_tenantId_idx" ON "WorkingHours"("tenantId");

-- BlockedTime indexleri
CREATE INDEX IF NOT EXISTS "BlockedTime_staffId_idx" ON "BlockedTime"("staffId");
CREATE INDEX IF NOT EXISTS "BlockedTime_tenantId_idx" ON "BlockedTime"("tenantId");

-- Notification indexleri
CREATE INDEX IF NOT EXISTS "Notification_customerId_idx" ON "Notification"("customerId");
CREATE INDEX IF NOT EXISTS "Notification_tenantId_idx" ON "Notification"("tenantId");
CREATE INDEX IF NOT EXISTS "Notification_sentAt_idx" ON "Notification"("sentAt");

-- ============================================
-- 5. Enum tipleri (PostgreSQL için)
-- ============================================
-- Not: Prisma enum'ları PostgreSQL'de native enum olarak oluşturur
-- Bu migration Prisma tarafından otomatik yönetilir

-- ============================================
-- 6. BookingReminder tablosu (Otomatik hatırlatmalar)
-- ============================================
CREATE TABLE IF NOT EXISTS "BookingReminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookingId" TEXT NOT NULL,
    "type" TEXT NOT NULL, -- reminder_24h, reminder_1h
    "channel" TEXT NOT NULL, -- sms, email
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BookingReminder_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "BookingReminder_bookingId_idx" ON "BookingReminder"("bookingId");
CREATE INDEX IF NOT EXISTS "BookingReminder_type_idx" ON "BookingReminder"("type");
CREATE INDEX IF NOT EXISTS "BookingReminder_sentAt_idx" ON "BookingReminder"("sentAt");

-- ============================================
-- 7. Soft delete view (opsiyonel - deleted hariç kayıtları göster)
-- ============================================
CREATE OR REPLACE VIEW "ActiveBooking" AS
SELECT * FROM "Booking" WHERE "deletedAt" IS NULL;

-- ============================================
-- Migration tamamlandı
-- ============================================
