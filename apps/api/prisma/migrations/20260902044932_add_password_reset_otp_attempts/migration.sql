-- AlterTable
ALTER TABLE "PasswordResetToken" ADD COLUMN     "failedAttempts" INTEGER NOT NULL DEFAULT 0;
