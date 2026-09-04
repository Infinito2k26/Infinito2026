-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "idFileUrl" TEXT,
ADD COLUMN     "idNumber" TEXT,
ADD COLUMN     "idType" "IdentityType",
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "secondaryIdFileUrl" TEXT,
ADD COLUMN     "secondaryIdNumber" TEXT,
ADD COLUMN     "secondaryIdType" "IdentityType";
