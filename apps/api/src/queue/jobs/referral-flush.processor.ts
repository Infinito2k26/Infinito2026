import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger, Inject } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import Redis from 'ioredis';

@Processor('referral-flush')
@Injectable()
export class ReferralFlushProcessor extends WorkerHost {
  private readonly logger = new Logger(ReferralFlushProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super();
  }

  async process(): Promise<any> {
    this.logger.debug('Starting referral flush...');

    const tempKey = `referral_clicks_buffer_processing_${Date.now()}`;

    const exists = await this.redis.exists('referral_clicks_buffer');
    if (!exists) {
      this.logger.debug('No clicks to flush.');
      return { status: 'no_data' };
    }

    try {
      await this.redis.rename('referral_clicks_buffer', tempKey);
    } catch {
      this.logger.debug('Buffer renamed/deleted concurrently.');
      return { status: 'renamed_concurrently' };
    }

    const clicks = await this.redis.hgetall(tempKey);
    const codes = Object.keys(clicks);

    if (codes.length === 0) {
      await this.redis.del(tempKey);
      return { status: 'empty' };
    }

    try {
      for (const code of codes) {
        const count = parseInt(clicks[code], 10);
        if (isNaN(count)) continue;

        await this.prisma.cAProfile.updateMany({
          where: { refCode: code },
          data: { clickCount: { increment: count } },
        });
      }

      await this.redis.del(tempKey);
      this.logger.debug(`Flushed clicks for ${codes.length} referral codes.`);
      return { status: 'success', codesProcessed: codes.length };
    } catch (error) {
      this.logger.error('Error flushing clicks to DB', error);
      throw error;
    }
  }
}
