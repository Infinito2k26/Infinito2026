import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('email-verification-cleanup')
export class EmailVerificationCleanupProcessor extends WorkerHost {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'cleanup') {
      return;
    }

    const expiredUsers = await this.prisma.user.findMany({
      where: {
        isEmailVerified: false,
        verificationExpiresAt: {
          lt: new Date(),
        },
      },
      select: {
        id: true,
      },
    });

    if (expiredUsers.length === 0) {
      console.log(
        '[Email Verification Cleanup] Deleted 0 expired unverified users',
      );
      return;
    }

    const userIds = expiredUsers.map((user) => user.id);

    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({
        where: {
          userId: {
            in: userIds,
          },
        },
      }),

      this.prisma.user.deleteMany({
        where: {
          id: {
            in: userIds,
          },
        },
      }),
    ]);

    console.log(
      `[Email Verification Cleanup] Deleted ${expiredUsers.length} expired unverified users`,
    );
  }
}
