import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { LeaderboardService } from '../../leaderboard/leaderboard.service';
import { Inject } from '@nestjs/common';
import { REDIS_CLIENT } from '../../redis/redis.constants';
import Redis from 'ioredis';

@Processor('leaderboard-recalc')
@Injectable()
export class LeaderboardProcessor extends WorkerHost {
  private readonly logger = new Logger(LeaderboardProcessor.name);

  constructor(
    private readonly leaderboardService: LeaderboardService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {
    super();
  }

  async process(): Promise<any> {
    this.logger.debug('Starting leaderboard recalculation...');

    try {
      const leaderboard = await this.leaderboardService.calculateLeaderboard();
      await this.redis.setex(
        'ca_leaderboard',
        900,
        JSON.stringify(leaderboard),
      );

      this.logger.debug(
        `Leaderboard recalculated and cached. ${leaderboard.length} entries.`,
      );
      return { status: 'success', entries: leaderboard.length };
    } catch (error) {
      this.logger.error('Error recalculating leaderboard', error);
      throw error;
    }
  }
}
