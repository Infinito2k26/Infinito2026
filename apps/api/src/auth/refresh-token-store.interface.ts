export const REFRESH_TOKEN_STORE = 'REFRESH_TOKEN_STORE';

export interface RefreshTokenStore {
  save(userId: string, tokenHash: string, expiresAt: Date): Promise<void>;
  verify(userId: string, tokenHash: string): Promise<boolean>;
  revoke(userId: string): Promise<void>;
}
