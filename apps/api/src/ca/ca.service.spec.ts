import { Test } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { CaService } from './ca.service';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';
import { Prisma } from '@prisma/client';

describe('CaService.recordConversion', () => {
  let service: CaService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      cAProfile: { findUnique: jest.fn(), update: jest.fn() },
      referralConversion: { create: jest.fn() },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CaService,
        { provide: PrismaService, useValue: prisma },
        { provide: REDIS_CLIENT, useValue: {} },
      ],
    }).compile();

    service = moduleRef.get(CaService);
  });

  it('creates conversion and increments referralCount for valid refCode', async () => {
    prisma.cAProfile.findUnique.mockResolvedValue({ id: 'ca-1' });
    const fakeConversion = {
      id: 'conv-1',
      caId: 'ca-1',
      registrationId: 'reg-1',
    };
    prisma.$transaction.mockImplementation(async (fn: any) =>
      fn({
        referralConversion: {
          create: jest.fn().mockResolvedValue(fakeConversion),
        },
        cAProfile: { update: jest.fn().mockResolvedValue({}) },
      }),
    );

    const result = await service.recordConversion('CA-ABC-123', 'reg-1');
    expect(result).toEqual(fakeConversion);
  });

  it('throws NotFoundException for unknown refCode and writes nothing', async () => {
    prisma.cAProfile.findUnique.mockResolvedValue(null);

    await expect(service.recordConversion('BAD-CODE', 'reg-1')).rejects.toThrow(
      NotFoundException,
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('throws ConflictException on duplicate registrationId (P2002)', async () => {
    prisma.cAProfile.findUnique.mockResolvedValue({ id: 'ca-1' });
    const p2002 = new Prisma.PrismaClientKnownRequestError('duplicate', {
      code: 'P2002',
      clientVersion: 'test',
    });
    prisma.$transaction.mockRejectedValue(p2002);

    await expect(
      service.recordConversion('CA-ABC-123', 'reg-1'),
    ).rejects.toThrow(ConflictException);
  });

  it('runs conversion create and count increment inside a single transaction', async () => {
    prisma.cAProfile.findUnique.mockResolvedValue({ id: 'ca-1' });
    prisma.$transaction.mockResolvedValue({ id: 'conv-1' });

    await service.recordConversion('CA-ABC-123', 'reg-1');
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
