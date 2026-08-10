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
    // Validate code exists in DB. This could be cached in Redis in a real highly-scaled system, but checking DB is fine if caching isn't strictly requested. Wait, the prompt says "Validate that the referral code exists (return 404 if not found)".
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
      return { status: 'deduplicated' }; // Do nothing
    }

    await this.redis.setex(dedupKey, 3600, '1');

    // Increment buffer
    await this.redis.hincrby('referral_clicks_buffer', referralCode, 1);

    return { status: 'recorded' };
  }

  async getTasks(userId: string) {
    const ca = await this.prisma.cAProfile.findUnique({ where: { userId } });
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
    const ca = await this.prisma.cAProfile.findUnique({ where: { userId } });
    if (!ca) {
      throw new NotFoundException('CA Profile not found');
    }

    // Validate URL scheme if proofUrl provided
    if (proofUrl) {
      try {
        const parsedUrl = new URL(proofUrl);
        if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
          throw new BadRequestException(
            'Invalid URL scheme. Must be http or https.',
          );
        }
      } catch {
        throw new BadRequestException('Invalid proof URL');
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
        caId_taskId: { caId: ca.id, taskId },
      },
    });

    if (existing) {
      if (existing.status !== 'PENDING') {
        throw new ConflictException(
          'Resubmission is only allowed when status is PENDING',
        );
      }

      return this.prisma.cATaskAssignment.update({
        where: { id: existing.id },
        data: {
          status: 'SUBMITTED',
          proofUrl: finalProofUrl,
          proofNote,
          submittedAt: new Date(),
        },
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
}
