import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { Env } from '../config/env.schema';

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(() => {
    const config = {
      get: () => 'test-qr-signing-secret-at-least-32-chars-long',
    } as unknown as ConfigService<Env, true>;

    service = new TokenService(config);
  });

  it('round-trips a validly signed token', () => {
    const credentialId = '3fa85f64-5717-4562-b3fc-2c963f66afa6';
    const token = service.signToken(credentialId);

    expect(service.verifyToken(token)).toEqual({
      valid: true,
      credentialId,
    });
  });

  it('rejects a token with a tampered signature', () => {
    const token = service.signToken('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    const lastChar = token.endsWith('A') ? 'B' : 'A';
    const tampered = token.slice(0, -1) + lastChar;

    expect(service.verifyToken(tampered).valid).toBe(false);
  });

  it('rejects a token with a tampered credentialId', () => {
    const token = service.signToken('3fa85f64-5717-4562-b3fc-2c963f66afa6');
    const sig = token.slice(token.lastIndexOf('.') + 1);
    const tampered = `some-other-credential-id.${sig}`;

    expect(service.verifyToken(tampered).valid).toBe(false);
  });

  it('rejects malformed tokens without hitting timingSafeEqual', () => {
    expect(service.verifyToken('').valid).toBe(false);
    expect(service.verifyToken('no-separator').valid).toBe(false);
    expect(service.verifyToken('.missing-credential-id').valid).toBe(false);
    expect(service.verifyToken('missing-signature.').valid).toBe(false);
  });

  it('produces different signatures for different credential ids', () => {
    const tokenA = service.signToken('credential-a');
    const tokenB = service.signToken('credential-b');

    expect(tokenA).not.toEqual(tokenB);
  });
});
