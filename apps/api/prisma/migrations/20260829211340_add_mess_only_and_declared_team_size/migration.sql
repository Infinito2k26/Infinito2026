/*
  Warnings:

  - Added the required column `declaredSize` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "messOnlyRate" DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Registration" ADD COLUMN     "messOnlyHeadcount" INTEGER,
ADD COLUMN     "messOnlyOpted" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "declaredSize" INTEGER NOT NULL;
