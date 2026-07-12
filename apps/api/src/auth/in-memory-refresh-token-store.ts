import { Injectable } from '@nestjs/common';
import { RefreshTokenStore } from './refresh-token-store.interface';

interface Entry {
  tokenHash: string;
  expiresAt: Date;
}

// ponytail: in-memory refresh store, single-instance only; swap for RedisRefreshTokenStore
// in Phase B behind the same RefreshTokenStore interface — sessions don't survive a restart.
@Injectable()
export class InMemoryRefreshTokenStore implements RefreshTokenStore {
  private readonly entries = new Map<string, Entry>();

  save(userId: string, tokenHash: string, expiresAt: Date): Promise<void> {
    this.entries.set(userId, { tokenHash, expiresAt });
    return Promise.resolve();
  }

  verify(userId: string, tokenHash: string): Promise<boolean> {
    const entry = this.entries.get(userId);
    if (!entry) return Promise.resolve(false);
    if (entry.expiresAt < new Date()) {
      this.entries.delete(userId);
      return Promise.resolve(false);
    }
    return Promise.resolve(entry.tokenHash === tokenHash);
  }

  revoke(userId: string): Promise<void> {
    this.entries.delete(userId);
    return Promise.resolve();
  }
}
