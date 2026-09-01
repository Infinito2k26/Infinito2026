-- CreateEnum
CREATE TYPE "ApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "CAApplication" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "targetCollege" TEXT NOT NULL,
    "status" "ApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "rejectionReason" TEXT,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CAApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CAApplication_status_idx" ON "CAApplication"("status");

-- CreateIndex
CREATE INDEX "CAApplication_userId_idx" ON "CAApplication"("userId");

-- AddForeignKey
ALTER TABLE "CAApplication" ADD CONSTRAINT "CAApplication_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CAApplication" ADD CONSTRAINT "CAApplication_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
