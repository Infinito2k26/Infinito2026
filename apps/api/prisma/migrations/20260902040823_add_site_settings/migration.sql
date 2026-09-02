-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "upiVpa" TEXT,
    "upiPayeeName" TEXT,
    "paymentQrImageUrl" TEXT,
    "festStartAt" TIMESTAMP(3),
    "festEndAt" TIMESTAMP(3),
    "registrationCloseAt" TIMESTAMP(3),
    "dateRangeLabel" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedByUserId" UUID,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updatedByUserId_fkey" FOREIGN KEY ("updatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
