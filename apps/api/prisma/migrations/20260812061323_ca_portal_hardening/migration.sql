-- CreateEnum
CREATE TYPE "RecordStatus" AS ENUM ('ACTIVE', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "CAProfile" ADD COLUMN     "clickCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CATaskAssignment" ADD COLUMN     "rejectionReason" TEXT;

-- AlterTable
ALTER TABLE "CaTask" ADD COLUMN     "status" "RecordStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "consentedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ca_referral_leads" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "college" TEXT NOT NULL,
    "referralCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" TIMESTAMP(3),
    "registrationId" UUID,

    CONSTRAINT "ca_referral_leads_pkey" PRIMARY KEY ("id")
);
