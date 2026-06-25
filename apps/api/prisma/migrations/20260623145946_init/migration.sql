-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'VOLUNTEER', 'CAMPUS_AMBASSADOR', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "BroadCategory" AS ENUM ('OUTDOOR', 'INDOOR', 'ESPORTS', 'CULTURAL', 'TECHNICAL');

-- CreateEnum
CREATE TYPE "EventRegistrationType" AS ENUM ('INDIVIDUAL', 'TEAM');

-- CreateEnum
CREATE TYPE "GenderCategory" AS ENUM ('OPEN', 'MEN', 'WOMEN');

-- CreateEnum
CREATE TYPE "FeeStructure" AS ENUM ('FLAT', 'PER_HEAD', 'GENDER_BASED');

-- CreateEnum
CREATE TYPE "CustomFieldType" AS ENUM ('TEXT', 'NUMBER', 'SELECT', 'FILE');

-- CreateEnum
CREATE TYPE "CustomFieldScope" AS ENUM ('TEAM', 'PARTICIPANT');

-- CreateEnum
CREATE TYPE "SubOptionType" AS ENUM ('INDIVIDUAL', 'RELAY');

-- CreateEnum
CREATE TYPE "ParticipantRole" AS ENUM ('CAPTAIN', 'VICE_CAPTAIN', 'PLAYER', 'SUBSTITUTE');

-- CreateEnum
CREATE TYPE "IdentityType" AS ENUM ('COLLEGE_ID', 'AADHAR', 'PAN', 'DRIVING_LICENSE', 'PASSPORT', 'VOTER_ID');

-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING_PAYMENT', 'CONFIRMED', 'WAITLISTED', 'CANCELLED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentMode" AS ENUM ('ONLINE', 'MANUAL_SCREENSHOT');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('INITIATED', 'SUCCESS', 'FAILED', 'REFUNDED', 'RECONCILIATION_PENDING');

-- CreateEnum
CREATE TYPE "ScanDirection" AS ENUM ('ENTRY', 'EXIT');

-- CreateEnum
CREATE TYPE "ScanResult" AS ENUM ('VALID', 'INVALID', 'DUPLICATE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "VerificationLevel" AS ENUM ('BEHAVIORAL', 'API_CONFIRMED');

-- CreateEnum
CREATE TYPE "TaskSource" AS ENUM ('MODERATOR', 'BRAND');

-- CreateEnum
CREATE TYPE "TaskCategory" AS ENUM ('REFERRAL', 'SOCIAL_MEDIA', 'PHYSICAL', 'CONTENT', 'COMMUNITY');

-- CreateEnum
CREATE TYPE "ProofType" AS ENUM ('AUTO', 'URL_SUBMISSION', 'SCREENSHOT', 'PHOTO');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PARTICIPANT',
    "college" TEXT,
    "isIITP" BOOLEAN NOT NULL DEFAULT false,
    "iitpEmail" TEXT,
    "isIITPVerified" BOOLEAN NOT NULL DEFAULT false,
    "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "broadCategory" "BroadCategory" NOT NULL,
    "sportCategory" TEXT NOT NULL,
    "description" TEXT,
    "pointOfContactName" TEXT,
    "pointOfContactPhone" TEXT,
    "registrationType" "EventRegistrationType" NOT NULL,
    "genderCategory" "GenderCategory" NOT NULL,
    "teamSizeMin" INTEGER,
    "teamSizeMax" INTEGER,
    "maxSubstitutes" INTEGER,
    "viceCaptainRequired" BOOLEAN NOT NULL DEFAULT true,
    "coachAllowed" BOOLEAN NOT NULL DEFAULT false,
    "feeStructure" "FeeStructure" NOT NULL,
    "feeFlat" DECIMAL(10,2),
    "feePerHead" DECIMAL(10,2),
    "feeMale" DECIMAL(10,2),
    "feeFemale" DECIMAL(10,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "venue" TEXT,
    "hasAccommodation" BOOLEAN NOT NULL DEFAULT false,
    "accommodationRate" DECIMAL(10,2),
    "prizePool" DECIMAL(10,2),
    "capacity" INTEGER,
    "customFieldsDef" JSONB,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "registrationOpen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventSubOption" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "SubOptionType" NOT NULL,
    "maxSelectionsPerReg" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventSubOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventRulebook" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "version" TEXT,
    "uploadedById" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventRulebook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "captainId" UUID NOT NULL,
    "collegeName" TEXT NOT NULL,
    "collegeAddress" TEXT,
    "isIITP" BOOLEAN NOT NULL DEFAULT false,
    "viceCaptainName" TEXT,
    "viceCaptainPhone" TEXT,
    "coachName" TEXT,
    "coachPhone" TEXT,
    "inviteCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Participant" (
    "id" UUID NOT NULL,
    "teamId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "ParticipantRole" NOT NULL,
    "isRequired" BOOLEAN NOT NULL,
    "userId" UUID,
    "photoUrl" TEXT NOT NULL,
    "idType" "IdentityType" NOT NULL,
    "idNumber" TEXT NOT NULL,
    "idFileUrl" TEXT NOT NULL,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CAProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "refCode" TEXT NOT NULL,
    "assignedCollegeName" TEXT NOT NULL,
    "referralCount" INTEGER NOT NULL DEFAULT 0,
    "totalPoints" INTEGER NOT NULL DEFAULT 0,
    "rank" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CAProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialPlatformConfig" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "oauthEnabled" BOOLEAN NOT NULL DEFAULT false,
    "canVerifyAction" BOOLEAN NOT NULL DEFAULT false,
    "oauthScopes" TEXT[],
    "verifyEndpoint" TEXT,
    "metricsDef" JSONB NOT NULL,
    "constraintsDef" JSONB,
    "attributesDef" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialPlatformConfig_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CASocialAccount" (
    "id" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "platformId" UUID NOT NULL,
    "accountId" TEXT NOT NULL,
    "handle" TEXT NOT NULL,
    "accessToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CASocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Brand" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT,
    "contactName" TEXT,
    "contactEmail" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Brand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CaTask" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" "TaskCategory" NOT NULL,
    "source" "TaskSource" NOT NULL,
    "brandId" UUID,
    "platformId" UUID,
    "targetMetric" TEXT,
    "targetCount" INTEGER,
    "targetContentUrl" TEXT,
    "points" INTEGER NOT NULL,
    "deadline" TIMESTAMP(3),
    "proofType" "ProofType" NOT NULL DEFAULT 'SCREENSHOT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "eventId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CaTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CATaskAssignment" (
    "id" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
    "proofUrl" TEXT,
    "proofNote" TEXT,
    "fetchedStats" JSONB,
    "pointsAwarded" INTEGER,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "verifiedById" UUID,

    CONSTRAINT "CATaskAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SocialReferral" (
    "id" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "platformId" UUID NOT NULL,
    "taskId" UUID,
    "verifiedUserId" TEXT NOT NULL,
    "verifiedHandle" TEXT NOT NULL,
    "sessionToken" TEXT,
    "verificationLevel" "VerificationLevel" NOT NULL,
    "attributes" JSONB,
    "metrics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SocialReferral_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Registration" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "teamId" UUID,
    "userId" UUID,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "isIITP" BOOLEAN NOT NULL DEFAULT false,
    "genderDeclared" "GenderCategory",
    "accommodationOpted" BOOLEAN NOT NULL DEFAULT false,
    "accommodationDays" INTEGER,
    "accommodationHeadcount" INTEGER,
    "referredById" UUID,
    "customData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Registration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistrationSubOption" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "subOptionId" UUID NOT NULL,
    "relayMembers" JSONB,

    CONSTRAINT "RegistrationSubOption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ReferralConversion" (
    "id" UUID NOT NULL,
    "caId" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReferralConversion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "mode" "PaymentMode" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'INITIATED',
    "gatewayOrderId" TEXT,
    "gatewayPaymentId" TEXT,
    "screenshotUrl" TEXT,
    "transactionId" TEXT,
    "webhookVerified" BOOLEAN NOT NULL DEFAULT false,
    "idempotencyKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Credential" (
    "id" UUID NOT NULL,
    "registrationId" UUID NOT NULL,
    "participantId" UUID,
    "userId" UUID,
    "tokenHash" TEXT NOT NULL,
    "qrImageUrl" TEXT NOT NULL,
    "scanCount" INTEGER NOT NULL DEFAULT 0,
    "lastScannedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Credential_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanLog" (
    "id" UUID NOT NULL,
    "credentialId" UUID NOT NULL,
    "scannedById" UUID NOT NULL,
    "gate" TEXT NOT NULL,
    "direction" "ScanDirection" NOT NULL,
    "result" "ScanResult" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_iitpEmail_key" ON "User"("iitpEmail");

-- CreateIndex
CREATE INDEX "User_isIITP_role_idx" ON "User"("isIITP", "role");

-- CreateIndex
CREATE UNIQUE INDEX "Event_slug_key" ON "Event"("slug");

-- CreateIndex
CREATE INDEX "Event_isPublished_registrationOpen_idx" ON "Event"("isPublished", "registrationOpen");

-- CreateIndex
CREATE INDEX "Event_broadCategory_idx" ON "Event"("broadCategory");

-- CreateIndex
CREATE INDEX "EventSubOption_eventId_isActive_idx" ON "EventSubOption"("eventId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Team_inviteCode_key" ON "Team"("inviteCode");

-- CreateIndex
CREATE INDEX "Team_isIITP_idx" ON "Team"("isIITP");

-- CreateIndex
CREATE INDEX "Participant_teamId_role_idx" ON "Participant"("teamId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "CAProfile_userId_key" ON "CAProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CAProfile_refCode_key" ON "CAProfile"("refCode");

-- CreateIndex
CREATE UNIQUE INDEX "SocialPlatformConfig_slug_key" ON "SocialPlatformConfig"("slug");

-- CreateIndex
CREATE INDEX "SocialPlatformConfig_isActive_idx" ON "SocialPlatformConfig"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "CASocialAccount_caId_platformId_key" ON "CASocialAccount"("caId", "platformId");

-- CreateIndex
CREATE UNIQUE INDEX "CATaskAssignment_caId_taskId_key" ON "CATaskAssignment"("caId", "taskId");

-- CreateIndex
CREATE INDEX "SocialReferral_caId_platformId_idx" ON "SocialReferral"("caId", "platformId");

-- CreateIndex
CREATE INDEX "SocialReferral_taskId_idx" ON "SocialReferral"("taskId");

-- CreateIndex
CREATE UNIQUE INDEX "SocialReferral_platformId_verifiedUserId_key" ON "SocialReferral"("platformId", "verifiedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_teamId_key" ON "Registration"("teamId");

-- CreateIndex
CREATE INDEX "Registration_eventId_status_idx" ON "Registration"("eventId", "status");

-- CreateIndex
CREATE INDEX "Registration_referredById_idx" ON "Registration"("referredById");

-- CreateIndex
CREATE UNIQUE INDEX "Registration_eventId_userId_key" ON "Registration"("eventId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ReferralConversion_registrationId_key" ON "ReferralConversion"("registrationId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayOrderId_key" ON "Payment"("gatewayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_gatewayPaymentId_key" ON "Payment"("gatewayPaymentId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_idempotencyKey_key" ON "Payment"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_participantId_key" ON "Credential"("participantId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_userId_key" ON "Credential"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Credential_tokenHash_key" ON "Credential"("tokenHash");

-- CreateIndex
CREATE INDEX "ScanLog_credentialId_createdAt_idx" ON "ScanLog"("credentialId", "createdAt");

-- CreateIndex
CREATE INDEX "ScanLog_gate_direction_createdAt_idx" ON "ScanLog"("gate", "direction", "createdAt");

-- AddForeignKey
ALTER TABLE "EventSubOption" ADD CONSTRAINT "EventSubOption_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRulebook" ADD CONSTRAINT "EventRulebook_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventRulebook" ADD CONSTRAINT "EventRulebook_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_captainId_fkey" FOREIGN KEY ("captainId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Participant" ADD CONSTRAINT "Participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CAProfile" ADD CONSTRAINT "CAProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CASocialAccount" ADD CONSTRAINT "CASocialAccount_caId_fkey" FOREIGN KEY ("caId") REFERENCES "CAProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CASocialAccount" ADD CONSTRAINT "CASocialAccount_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "SocialPlatformConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaTask" ADD CONSTRAINT "CaTask_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "Brand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaTask" ADD CONSTRAINT "CaTask_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "SocialPlatformConfig"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CaTask" ADD CONSTRAINT "CaTask_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CATaskAssignment" ADD CONSTRAINT "CATaskAssignment_caId_fkey" FOREIGN KEY ("caId") REFERENCES "CAProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CATaskAssignment" ADD CONSTRAINT "CATaskAssignment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CaTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CATaskAssignment" ADD CONSTRAINT "CATaskAssignment_verifiedById_fkey" FOREIGN KEY ("verifiedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialReferral" ADD CONSTRAINT "SocialReferral_caId_fkey" FOREIGN KEY ("caId") REFERENCES "CAProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialReferral" ADD CONSTRAINT "SocialReferral_platformId_fkey" FOREIGN KEY ("platformId") REFERENCES "SocialPlatformConfig"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialReferral" ADD CONSTRAINT "SocialReferral_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "CaTask"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Registration" ADD CONSTRAINT "Registration_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "CAProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationSubOption" ADD CONSTRAINT "RegistrationSubOption_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistrationSubOption" ADD CONSTRAINT "RegistrationSubOption_subOptionId_fkey" FOREIGN KEY ("subOptionId") REFERENCES "EventSubOption"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralConversion" ADD CONSTRAINT "ReferralConversion_caId_fkey" FOREIGN KEY ("caId") REFERENCES "CAProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReferralConversion" ADD CONSTRAINT "ReferralConversion_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "Registration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_participantId_fkey" FOREIGN KEY ("participantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Credential" ADD CONSTRAINT "Credential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_credentialId_fkey" FOREIGN KEY ("credentialId") REFERENCES "Credential"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanLog" ADD CONSTRAINT "ScanLog_scannedById_fkey" FOREIGN KEY ("scannedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Custom check constraints
ALTER TABLE "Registration" ADD CONSTRAINT "registration_team_or_user"
  CHECK ("teamId" IS NOT NULL OR "userId" IS NOT NULL);
  
ALTER TABLE "Credential" ADD CONSTRAINT "credential_participant_or_user"
  CHECK ("participantId" IS NOT NULL OR "userId" IS NOT NULL);
