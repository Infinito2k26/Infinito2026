-- AlterTable
ALTER TABLE "Participant" ADD COLUMN     "secondaryIdFileUrl" TEXT,
ADD COLUMN     "secondaryIdNumber" TEXT,
ADD COLUMN     "secondaryIdType" "IdentityType";
