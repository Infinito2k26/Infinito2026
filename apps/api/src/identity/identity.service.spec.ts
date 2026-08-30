import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { IdentityService } from './identity.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { TokenService } from './token.service';
import { Env } from '../config/env.schema';

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

describe('IdentityService', () => {
  let service: IdentityService;
  let tokenService: TokenService;

  let prisma: {
    registration: { findUnique: jest.Mock };
    credential: {
      findUnique: jest.Mock;
      create: jest.Mock;
    };
    participant: { findFirst: jest.Mock };
    scanLog: { findMany: jest.Mock; count: jest.Mock };
    $transaction: jest.Mock;
  };

  let uploadsService: { uploadProof: jest.Mock; getSignedGetUrl: jest.Mock };

  beforeEach(() => {
    prisma = {
      registration: { findUnique: jest.fn() },
      credential: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      participant: { findFirst: jest.fn() },
      scanLog: { findMany: jest.fn(), count: jest.fn() },
      $transaction: jest.fn(),
    };

    uploadsService = {
      uploadProof: jest.fn().mockResolvedValue({ key: 'qr-codes/abc' }),
      getSignedGetUrl: jest.fn(
        (key: string) => `https://signed.example/${key}`,
      ),
    };

    const config = {
      get: () => 'test-qr-signing-secret-at-least-32-chars-long',
    } as unknown as ConfigService<Env, true>;
    tokenService = new TokenService(config);

    service = new IdentityService(
      prisma as unknown as PrismaService,
      uploadsService as unknown as UploadsService,
      tokenService,
    );
  });

  describe('issueCredentialsForPayment', () => {
    it('does nothing when the registration no longer exists', async () => {
      prisma.registration.findUnique.mockResolvedValue(null);

      await service.issueCredentialsForPayment('reg-1');

      expect(prisma.credential.create).not.toHaveBeenCalled();
    });

    it('creates exactly one credential for an individual registration', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: 'user-1',
        team: null,
      });
      prisma.credential.findUnique.mockResolvedValue(null);

      await service.issueCredentialsForPayment('reg-1');

      expect(prisma.credential.create).toHaveBeenCalledTimes(1);
      expect(prisma.credential.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            registrationId: 'reg-1',
            userId: 'user-1',
            participantId: null,
          }) as unknown,
        }),
      );
    });

    it('is idempotent when a credential already exists for the user', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: 'user-1',
        team: null,
      });
      prisma.credential.findUnique.mockResolvedValue({ id: 'existing' });

      await service.issueCredentialsForPayment('reg-1');

      expect(prisma.credential.create).not.toHaveBeenCalled();
    });

    it('creates one credential per team participant', async () => {
      prisma.registration.findUnique.mockResolvedValue({
        id: 'reg-1',
        userId: null,
        team: {
          participants: [{ id: 'p-1' }, { id: 'p-2' }],
        },
      });
      prisma.credential.findUnique.mockResolvedValue(null);

      await service.issueCredentialsForPayment('reg-1');

      expect(prisma.credential.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('getMyCredential', () => {
    it('returns the credential linked directly by userId', async () => {
      prisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        scanCount: 0,
        lastScannedAt: null,
        qrImageUrl: 'qr-codes/abc',
        createdAt: new Date('2026-08-29'),
      });

      const result = await service.getMyCredential('user-1');

      expect(result.qrImageUrl).toBe('https://signed.example/qr-codes/abc');
    });

    it('falls back to the credential linked via a team participant', async () => {
      prisma.credential.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({
          id: 'cred-2',
          scanCount: 1,
          lastScannedAt: null,
          qrImageUrl: 'qr-codes/def',
          createdAt: new Date('2026-08-29'),
        });
      prisma.participant.findFirst.mockResolvedValue({ id: 'p-1' });

      const result = await service.getMyCredential('user-1');

      expect(result.id).toBe('cred-2');
    });

    it('throws NotFoundException when no credential exists yet', async () => {
      prisma.credential.findUnique.mockResolvedValue(null);
      prisma.participant.findFirst.mockResolvedValue(null);

      await expect(service.getMyCredential('user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('validateToken', () => {
    it('rejects a tampered token before any DB lookup', async () => {
      const result = await service.validateToken('tampered.token');

      expect(result).toEqual({ valid: false });
      expect(prisma.credential.findUnique).not.toHaveBeenCalled();
    });

    it('validates a correctly signed token against its stored hash', async () => {
      const rawToken = tokenService.signToken('cred-1');
      prisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        scanCount: 2,
        lastScannedAt: null,
        user: { name: 'Jane Doe' },
        participant: null,
      });

      const result = await service.validateToken(rawToken);

      expect(prisma.credential.findUnique).toHaveBeenCalledWith({
        where: { tokenHash: hashToken(rawToken) },
        include: {
          user: { select: { name: true } },
          participant: { select: { name: true } },
        },
      });
      expect(result).toEqual({
        valid: true,
        credentialId: 'cred-1',
        holderName: 'Jane Doe',
        scanCount: 2,
        lastScannedAt: null,
      });
    });

    it('returns invalid when the token is structurally valid but revoked/unknown', async () => {
      const rawToken = tokenService.signToken('missing-cred');
      prisma.credential.findUnique.mockResolvedValue(null);

      const result = await service.validateToken(rawToken);

      expect(result).toEqual({ valid: false });
    });
  });

  describe('scan', () => {
    const scanDto = { token: '', gate: 'Gate 1', direction: 'ENTRY' as const };

    function mockTransaction(tx: {
      scanLog: { findFirst: jest.Mock; create: jest.Mock };
      credential: { update: jest.Mock };
    }) {
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn(tx),
      );
      return tx;
    }

    it('rejects a tampered token before any DB write (critical test #9)', async () => {
      await expect(
        service.scan('volunteer-1', { ...scanDto, token: 'tampered.token' }),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.credential.findUnique).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the credential does not exist', async () => {
      const rawToken = tokenService.signToken('missing-cred');
      prisma.credential.findUnique.mockResolvedValue(null);

      await expect(
        service.scan('volunteer-1', { ...scanDto, token: rawToken }),
      ).rejects.toThrow(NotFoundException);

      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('records exactly one scan log and increments scanCount on a fresh scan (critical test #8)', async () => {
      const rawToken = tokenService.signToken('cred-1');
      prisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        scanCount: 0,
      });

      const scanLogCreate = jest
        .fn()
        .mockResolvedValue({ id: 'log-1', result: 'VALID' });
      const credentialUpdate = jest.fn().mockResolvedValue({});
      mockTransaction({
        scanLog: {
          findFirst: jest.fn().mockResolvedValue(null),
          create: scanLogCreate,
        },
        credential: { update: credentialUpdate },
      });

      const result = await service.scan('volunteer-1', {
        ...scanDto,
        token: rawToken,
      });

      expect(scanLogCreate).toHaveBeenCalledTimes(1);
      expect(scanLogCreate).toHaveBeenCalledWith({
        data: {
          credentialId: 'cred-1',
          scannedById: 'volunteer-1',
          gate: 'Gate 1',
          direction: 'ENTRY',
          result: 'VALID',
        },
      });
      expect(credentialUpdate).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
        data: {
          scanCount: { increment: 1 },
          lastScannedAt: expect.any(Date) as Date,
        },
      });
      expect(result.result).toBe('VALID');
    });

    it('marks a repeated same-direction scan as DUPLICATE without incrementing scanCount', async () => {
      const rawToken = tokenService.signToken('cred-1');
      prisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        scanCount: 1,
      });

      const scanLogCreate = jest
        .fn()
        .mockResolvedValue({ id: 'log-2', result: 'DUPLICATE' });
      const credentialUpdate = jest.fn();
      mockTransaction({
        scanLog: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ result: 'VALID', direction: 'ENTRY' }),
          create: scanLogCreate,
        },
        credential: { update: credentialUpdate },
      });

      const result = await service.scan('volunteer-1', {
        ...scanDto,
        token: rawToken,
      });

      expect(scanLogCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ result: 'DUPLICATE' }) as unknown,
        }),
      );
      expect(credentialUpdate).not.toHaveBeenCalled();
      expect(result.result).toBe('DUPLICATE');
    });

    it('does not treat an opposite-direction scan as a duplicate', async () => {
      const rawToken = tokenService.signToken('cred-1');
      prisma.credential.findUnique.mockResolvedValue({
        id: 'cred-1',
        scanCount: 1,
      });

      const scanLogCreate = jest
        .fn()
        .mockResolvedValue({ id: 'log-3', result: 'VALID' });
      mockTransaction({
        scanLog: {
          findFirst: jest
            .fn()
            .mockResolvedValue({ result: 'VALID', direction: 'EXIT' }),
          create: scanLogCreate,
        },
        credential: { update: jest.fn().mockResolvedValue({}) },
      });

      const result = await service.scan('volunteer-1', {
        ...scanDto,
        token: rawToken,
        direction: 'ENTRY',
      });

      expect(result.result).toBe('VALID');
    });
  });

  describe('listScans', () => {
    it('paginates and resolves the holder name from user or participant', async () => {
      prisma.$transaction.mockImplementation((arg: unknown) =>
        Array.isArray(arg) ? Promise.all(arg) : arg,
      );
      prisma.scanLog.findMany.mockResolvedValue([
        {
          id: 'log-1',
          gate: 'Gate 1',
          direction: 'ENTRY',
          result: 'VALID',
          createdAt: new Date('2026-08-30'),
          scannedBy: { id: 'vol-1', name: 'Volunteer One' },
          credential: {
            id: 'cred-1',
            user: { name: 'Jane Doe' },
            participant: null,
          },
        },
        {
          id: 'log-2',
          gate: 'Gate 1',
          direction: 'ENTRY',
          result: 'VALID',
          createdAt: new Date('2026-08-30'),
          scannedBy: { id: 'vol-1', name: 'Volunteer One' },
          credential: {
            id: 'cred-2',
            user: null,
            participant: { name: 'John Roe' },
          },
        },
      ]);
      prisma.scanLog.count.mockResolvedValue(2);

      const result = await service.listScans();

      expect(result.scans[0]).toEqual(
        expect.objectContaining({
          credentialId: 'cred-1',
          holderName: 'Jane Doe',
        }),
      );
      expect(result.scans[1]).toEqual(
        expect.objectContaining({
          credentialId: 'cred-2',
          holderName: 'John Roe',
        }),
      );
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 2,
        totalPages: 1,
      });
    });
  });
});
