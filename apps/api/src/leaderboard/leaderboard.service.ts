import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import Redis from 'ioredis';
import { LeaderboardEntry } from './interfaces/leaderboard.interface';

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getLeaderboard(): Promise<LeaderboardEntry[]> {
    const cached = await this.redis.get('ca_leaderboard');
    if (cached) {
      return JSON.parse(cached) as LeaderboardEntry[];
    }

    // Cold start fallback
    const leaderboard = await this.calculateLeaderboard();

    // Cache it for the next request (TTL 15 mins)
    await this.redis.setex('ca_leaderboard', 900, JSON.stringify(leaderboard));

    return leaderboard;
  }

  async calculateLeaderboard(): Promise<LeaderboardEntry[]> {
    const cas = await this.prisma.cAProfile.findMany({
      where: { isActive: true },
      select: {
        id: true,
        refCode: true,
        assignedCollegeName: true,
        totalPoints: true,
        clickCount: true,
        referralCount: true,
        user: {
          select: { name: true },
        },
      },
      orderBy: [{ totalPoints: 'desc' }, { referralCount: 'desc' }],
      take: 100, // Top 100
    });

    return cas.map((ca, index) => ({
      rank: index + 1,
      id: ca.id,
      name: ca.user.name,
      college: ca.assignedCollegeName,
      totalPoints: ca.totalPoints,
      clickCount: ca.clickCount,
      referralCount: ca.referralCount,
    }));
  }
}
