import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '../config/env.schema';

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
  ],
  exports: [BullModule],
})
export class QueueModule {}
