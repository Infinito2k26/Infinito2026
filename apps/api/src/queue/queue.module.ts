import { BullModule, InjectQueue } from '@nestjs/bullmq';
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.schema';
import { Queue } from 'bullmq';
import { ReferralFlushProcessor } from './jobs/referral-flush.processor';
import { LeaderboardProcessor } from './jobs/leaderboard.processor';
import { LeaderboardModule } from '../leaderboard/leaderboard.module';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => {
        const url = new URL(config.get('REDIS_URL', { infer: true }));
        return {
          connection: {
            host: url.hostname,
            port: Number(url.port),
            password: url.password || undefined,
            // BullMQ workers issue blocking commands and require this disabled on their connection.
            maxRetriesPerRequest: null,
          },
        };
      },
    }),
    BullModule.registerQueue(
      { name: 'referral-flush' },
      { name: 'leaderboard-recalc' },
      { name: 'social-metrics-fetch' },
    ),
    LeaderboardModule,
  ],
  providers: [ReferralFlushProcessor, LeaderboardProcessor],
  exports: [BullModule],
})
export class QueueModule implements OnModuleInit {
  constructor(
    @InjectQueue('referral-flush') private readonly flushQueue: Queue,
    @InjectQueue('leaderboard-recalc') private readonly leaderboardQueue: Queue,
  ) {}

  async onModuleInit() {
    await this.flushQueue.add(
      'flush',
      {},
      {
        repeat: {
          pattern: '*/1 * * * *',
        },
      },
    );

    await this.leaderboardQueue.add(
      'recalc',
      {},
      {
        repeat: {
          pattern: '*/15 * * * *',
        },
      },
    );
  }
}
