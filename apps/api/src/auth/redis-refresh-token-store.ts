import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { RefreshTokenStore } from './refresh-token-store.interface';

const keyFor = (userId: string) => `refresh-token:${userId}`;

@Injectable()
export class RedisRefreshTokenStore implements RefreshTokenStore {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async save(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void> {
    const ttlSeconds = Math.max(
      1,
      Math.ceil((expiresAt.getTime() - Date.now()) / 1000),
    );
    await this.redis.set(keyFor(userId), tokenHash, 'EX', ttlSeconds);
  }

  async verify(userId: string, tokenHash: string): Promise<boolean> {
    const stored = await this.redis.get(keyFor(userId));
    return stored === tokenHash;
  }

  async revoke(userId: string): Promise<void> {
    await this.redis.del(keyFor(userId));
  }
}
