-- AlterTable
ALTER TABLE "BusinessProfile" ADD COLUMN     "allowOnlineBooking" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "bufferTimeMinutes" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "cancellationPolicyHours" INTEGER NOT NULL DEFAULT 24,
ADD COLUMN     "maxAdvanceBookingDays" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "minAdvanceBookingHours" INTEGER NOT NULL DEFAULT 1;
