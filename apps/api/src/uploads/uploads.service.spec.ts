import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

import { UploadsService } from './uploads.service';

describe('UploadsService', () => {
  describe('getSignedGetUrl with Cloudinary configured', () => {
    let service: UploadsService;

    beforeEach(async () => {
      const config = {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = {
            CLOUDINARY_CLOUD_NAME: 'test-cloud',
            CLOUDINARY_API_KEY: 'test-key',
            CLOUDINARY_API_SECRET: 'test-secret',
            PORT: '3000',
          };
          return values[key];
        }),
      };

      const moduleRef = await Test.createTestingModule({
        providers: [
          UploadsService,
          { provide: ConfigService, useValue: config },
        ],
      }).compile();

      service = moduleRef.get<UploadsService>(UploadsService);
    });

    // Regression test: the Cloudinary SDK's `auth_token` option requires a
    // per-account "Auth Token key" that this deployment never configured —
    // passing `{ duration }` without `key` throws a raw TypeError from the
    // SDK's HMAC call, which surfaced as a 500 on every endpoint returning a
    // signed URL (payments, gallery, team photos, sponsor logos) the moment
    // any real file existed to sign. `expires_at`-based signing uses the
    // already-configured API secret instead and must not throw.
    it('does not throw and returns a signed URL', () => {
      const url = service.getSignedGetUrl('payment-proof/some-key', 900);
      expect(url).toContain('res.cloudinary.com');
      expect(url).toContain('/authenticated/');
      expect(url).toContain('payment-proof/some-key');
    });
  });

  describe('getSignedGetUrl on local disk (no Cloudinary configured)', () => {
    it('returns a local-uploads URL', () => {
      const config = {
        get: jest.fn((key: string) => {
          const values: Record<string, string> = { PORT: '3000' };
          return values[key];
        }),
      };

      const service = new UploadsService(config as never);
      const url = service.getSignedGetUrl('team-photo/some-key');
      expect(url).toBe(
        'http://localhost:3000/local-uploads/team-photo/some-key',
      );
    });
  });
});
