/*
  Warnings:

  - Added the required column `eventId` to the `Team` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "eventId" UUID NOT NULL;

-- CreateIndex
CREATE INDEX "Team_eventId_idx" ON "Team"("eventId");

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
