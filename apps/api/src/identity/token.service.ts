import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, timingSafeEqual } from 'crypto';
import { Env } from '../config/env.schema';

export interface TokenVerificationResult {
  valid: boolean;
  credentialId?: string;
}

@Injectable()
export class TokenService {
  constructor(private readonly config: ConfigService<Env, true>) {}

  signToken(credentialId: string): string {
    return `${credentialId}.${this.sign(credentialId)}`;
  }

  verifyToken(rawToken: string): TokenVerificationResult {
    const separatorIndex = rawToken.lastIndexOf('.');
    if (separatorIndex <= 0 || separatorIndex === rawToken.length - 1) {
      return { valid: false };
    }

    const credentialId = rawToken.slice(0, separatorIndex);
    const providedSig = Buffer.from(rawToken.slice(separatorIndex + 1));
    const expectedSig = Buffer.from(this.sign(credentialId));

    if (
      providedSig.length !== expectedSig.length ||
      !timingSafeEqual(providedSig, expectedSig)
    ) {
      return { valid: false };
    }

    return { valid: true, credentialId };
  }

  private sign(credentialId: string): string {
    const secret = this.config.get('QR_SIGNING_SECRET', { infer: true });
    return createHmac('sha256', secret)
      .update(credentialId)
      .digest('base64url');
  }
}
