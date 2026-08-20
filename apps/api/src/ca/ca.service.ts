import { Prisma } from '@prisma/client';

import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import Redis from 'ioredis';
import * as crypto from 'crypto';

@Injectable()
export class CaService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async onboard(userId: string, college: string) {
    const existing = await this.prisma.cAProfile.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new ConflictException('CA profile already exists for this user');
    }

    // Generate unguessable referral code
    const suffix = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars

    const collegeCode = college
      .substring(0, 3)
      .toUpperCase()
      .replace(/[^A-Z]/g, 'X');

    const referralCode = `CA-${collegeCode}-${suffix}`;

    const profile = await this.prisma.cAProfile.create({
      data: {
        userId,
        refCode: referralCode,
        assignedCollegeName: college,
        referralCount: 0,
        clickCount: 0,
        totalPoints: 0,
      },
    });

    return profile;
  }

  async recordClick(referralCode: string, ip: string) {
    // Validate code exists in DB
    const ca = await this.prisma.cAProfile.findUnique({
      where: { refCode: referralCode },
      select: { id: true },
    });

    if (!ca) {
      throw new NotFoundException('Referral code not found');
    }

    // Deduplication
    const hashedIp = crypto.createHash('sha256').update(ip).digest('hex');
    const dedupKey = `referral_click:${referralCode}:${hashedIp}`;

    const exists = await this.redis.get(dedupKey);

    if (exists) {
      return { status: 'deduplicated' };
    }

    await this.redis.setex(dedupKey, 3600, '1');

    // Increment buffer
    await this.redis.hincrby('referral_clicks_buffer', referralCode, 1);

    return { status: 'recorded' };
  }

  async getTasks(userId: string) {
    const ca = await this.prisma.cAProfile.findUnique({
      where: { userId },
    });

    if (!ca) {
      throw new NotFoundException('CA Profile not found');
    }

    return this.prisma.caTask.findMany({
      where: { status: 'ACTIVE' },
      include: {
        assignments: {
          where: { caId: ca.id },
        },
      },
    });
  }

  async submitTask(
    userId: string,
    taskId: string,
    proofUrl?: string,
    fileUrl?: string,
    proofNote?: string,
  ) {
    const ca = await this.prisma.cAProfile.findUnique({
      where: { userId },
    });

    if (!ca) {
      throw new NotFoundException('CA Profile not found');
    }

    // Validate URL scheme if proofUrl provided
    if (proofUrl) {
      let parsedUrl: URL;

      try {
        parsedUrl = new URL(proofUrl);
      } catch {
        throw new BadRequestException('Invalid proof URL');
      }

      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new BadRequestException(
          'Invalid URL scheme. Only http and https are allowed.',
        );
      }
    }

    const finalProofUrl = proofUrl || fileUrl;

    if (!finalProofUrl) {
      throw new BadRequestException(
        'Either proofUrl or an uploaded file is required',
      );
    }

    // Check existing assignment
    const existing = await this.prisma.cATaskAssignment.findUnique({
      where: {
        caId_taskId: {
          caId: ca.id,
          taskId,
        },
      },
    });

    if (existing) {
      if (existing.status !== 'PENDING') {
        throw new ConflictException(
          'Resubmission is only allowed when status is PENDING',
        );
      }

      // Atomic compare-and-set:
      // Only update if the assignment is still PENDING.
      const updated = await this.prisma.cATaskAssignment.updateMany({
        where: {
          id: existing.id,
          status: 'PENDING',
        },
        data: {
          status: 'SUBMITTED',
          proofUrl: finalProofUrl,
          proofNote,
          submittedAt: new Date(),
        },
      });

      if (updated.count === 0) {
        throw new ConflictException(
          'Resubmission is only allowed when status is PENDING',
        );
      }

      return this.prisma.cATaskAssignment.findUniqueOrThrow({
        where: { id: existing.id },
      });
    }

    // Create new assignment
    return this.prisma.cATaskAssignment.create({
      data: {
        caId: ca.id,
        taskId,
        status: 'SUBMITTED',
        proofUrl: finalProofUrl,
        proofNote,
        submittedAt: new Date(),
      },
    });
  }

  async applyForCA(userId: string, targetCollege: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { role: true },
    });

    if (user.role === 'CAMPUS_AMBASSADOR') {
      throw new ConflictException('You are already a Campus Ambassador');
    }

    const existingPending = await this.prisma.cAApplication.findFirst({
      where: { userId, status: 'PENDING' },
    });

    if (existingPending) {
      throw new ConflictException(
        'You already have a pending Campus Ambassador application',
      );
    }

    return this.prisma.cAApplication.create({
      data: {
        userId,
        targetCollege,
        status: 'PENDING',
      },
    });
  }

  async getMyApplication(userId: string) {
    return this.prisma.cAApplication.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Records a referral conversion for a given refCode + registrationId.
   * Deliberately NOT wired to any controller yet — the Registration module
   * will call this once it is complete. Until then, ca_referral_leads /
   * the waitlist data remains the reconciliation source of truth.
   */
  async recordConversion(refCode: string, registrationId: string) {
    const ca = await this.prisma.cAProfile.findUnique({
      where: { refCode },
      select: { id: true },
    });

    if (!ca) {
      throw new NotFoundException('Referral code not found');
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        const conversion = await tx.referralConversion.create({
          data: {
            caId: ca.id,
            registrationId,
          },
        });

        await tx.cAProfile.update({
          where: { id: ca.id },
          data: {
            referralCount: {
              increment: 1,
            },
          },
        });

        return conversion;
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        throw new ConflictException(
          'A conversion already exists for this registration',
        );
      }

      throw err;
    }
  }
}
