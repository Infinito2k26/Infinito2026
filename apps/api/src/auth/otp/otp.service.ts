import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type Redis from 'ioredis';
import { Env } from '../../config/env.schema';
import { REDIS_CLIENT } from '../../redis/redis.constants';

@Injectable()
export class OtpService {
  constructor(
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
    private readonly config: ConfigService<Env, true>,
  ) {}

  private key(email: string, purpose: string) {
    return `otp:${purpose}:${email}`;
  }

  async generateAndStore(
    email: string,
    purpose: 'register' | 'forgot-password',
  ): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const ttl = this.config.get('OTP_EXPIRY_SECONDS', { infer: true });
    await this.redis.set(this.key(email, purpose), otp, 'EX', ttl);
    return otp;
  }

  async verify(email: string, purpose: string, otp: string): Promise<boolean> {
    const stored = await this.redis.get(this.key(email, purpose));
    if (!stored || stored !== otp) return false;
    await this.redis.del(this.key(email, purpose));
    return true;
  }
}
