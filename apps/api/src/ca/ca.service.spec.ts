import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { CaService } from './ca.service';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.constants';

describe('CaService.recordConversion', () => {
  let service: CaService;

  let prisma: {
    cAProfile: {
      findUnique: jest.Mock;
      update: jest.Mock;
    };
    referralConversion: {
      create: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      cAProfile: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      referralConversion: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: REDIS_CLIENT,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get<CaService>(CaService);
  });

  it('creates conversion and increments referralCount for valid refCode', async () => {
    prisma.cAProfile.findUnique.mockResolvedValue({
      id: 'ca-1',
    });

    const fakeConversion = {
      id: 'conv-1',
      caId: 'ca-1',
      registrationId: 'reg-1',
    };

    prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
      Promise.resolve(
        fn({
          referralConversion: {
            create: jest.fn().mockResolvedValue(fakeConversion),
          },
          cAProfile: {
            update: jest.fn().mockResolvedValue({}),
          },
        }),
      ),
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
    prisma.cAProfile.findUnique.mockResolvedValue({
      id: 'ca-1',
    });

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
    prisma.cAProfile.findUnique.mockResolvedValue({
      id: 'ca-1',
    });

    prisma.$transaction.mockResolvedValue({
      id: 'conv-1',
    });

    await service.recordConversion('CA-ABC-123', 'reg-1');

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});

describe('CaService.applyForCA', () => {
  let service: CaService;

  let prisma: {
    user: {
      findUniqueOrThrow: jest.Mock;
    };
    cAApplication: {
      findFirst: jest.Mock;
      create: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      user: {
        findUniqueOrThrow: jest.fn(),
      },
      cAApplication: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: REDIS_CLIENT,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get<CaService>(CaService);
  });

  it('creates a PENDING application for an eligible user', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ role: 'PARTICIPANT' });
    prisma.cAApplication.findFirst.mockResolvedValue(null);

    const fakeApplication = {
      id: 'app-1',
      userId: 'user-1',
      targetCollege: 'IIT Patna',
      status: 'PENDING',
    };
    prisma.cAApplication.create.mockResolvedValue(fakeApplication);

    const result = await service.applyForCA('user-1', 'IIT Patna');

    expect(result).toEqual(fakeApplication);
    expect(prisma.cAApplication.create).toHaveBeenCalledWith({
      data: { userId: 'user-1', targetCollege: 'IIT Patna', status: 'PENDING' },
    });
  });

  it('throws ConflictException if the user is already a Campus Ambassador', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({
      role: 'CAMPUS_AMBASSADOR',
    });

    await expect(service.applyForCA('user-1', 'IIT Patna')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.cAApplication.create).not.toHaveBeenCalled();
  });

  it('throws ConflictException if a PENDING application already exists', async () => {
    prisma.user.findUniqueOrThrow.mockResolvedValue({ role: 'PARTICIPANT' });
    prisma.cAApplication.findFirst.mockResolvedValue({
      id: 'app-existing',
      status: 'PENDING',
    });

    await expect(service.applyForCA('user-1', 'IIT Patna')).rejects.toThrow(
      ConflictException,
    );
    expect(prisma.cAApplication.create).not.toHaveBeenCalled();
  });
});

describe('CaService.getMyApplication', () => {
  let service: CaService;

  let prisma: {
    cAApplication: {
      findFirst: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      cAApplication: {
        findFirst: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: REDIS_CLIENT,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get<CaService>(CaService);
  });

  it('returns null when the user has no application', async () => {
    prisma.cAApplication.findFirst.mockResolvedValue(null);

    const result = await service.getMyApplication('user-1');

    expect(result).toBeNull();
  });

  it('returns the most recently created application', async () => {
    const latest = { id: 'app-2', status: 'PENDING', createdAt: new Date() };
    prisma.cAApplication.findFirst.mockResolvedValue(latest);

    const result = await service.getMyApplication('user-1');

    expect(result).toEqual(latest);
    expect(prisma.cAApplication.findFirst).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      orderBy: { createdAt: 'desc' },
    });
  });
});

describe('CaService.getMe', () => {
  let service: CaService;

  let prisma: {
    cAProfile: {
      findUnique: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      cAProfile: {
        findUnique: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        CaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: REDIS_CLIENT,
          useValue: {},
        },
      ],
    }).compile();

    service = moduleRef.get<CaService>(CaService);
  });

  it('returns the CA profile for an onboarded user', async () => {
    const profile = { id: 'ca-1', userId: 'user-1', refCode: 'CA-IIT-ABC123' };
    prisma.cAProfile.findUnique.mockResolvedValue(profile);

    const result = await service.getMe('user-1');

    expect(result).toEqual(profile);
    expect(prisma.cAProfile.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('throws NotFoundException when the user has not onboarded yet', async () => {
    prisma.cAProfile.findUnique.mockResolvedValue(null);

    await expect(service.getMe('user-1')).rejects.toThrow(NotFoundException);
  });
});
