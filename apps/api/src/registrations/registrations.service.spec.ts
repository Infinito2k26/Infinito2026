import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Prisma,
  EventRegistrationType,
  FeeStructure,
  IdentityType,
  SubOptionType,
} from '@prisma/client';

import { RegistrationsService } from './registrations.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

const identityFiles = {
  photoFile: { buffer: Buffer.from('photo'), mimetype: 'image/png' },
  idFile: { buffer: Buffer.from('id'), mimetype: 'image/png' },
  secondaryIdFile: { buffer: Buffer.from('secondary'), mimetype: 'image/png' },
};
const individualIdentityDto = {
  idNumber: 'ID-1',
  secondaryIdType: IdentityType.AADHAR,
  secondaryIdNumber: 'AADHAR-1',
};

const flatTeamEvent = {
  id: 'event-1',
  registrationType: EventRegistrationType.TEAM,
  isPublished: true,
  registrationOpen: true,
  capacity: null,
  teamSizeMin: 3,
  teamSizeMax: 5,
  feeStructure: FeeStructure.FLAT,
  feeFlat: new Prisma.Decimal(500),
  feePerHead: null,
  feeMale: null,
  feeFemale: null,
  hasAccommodation: false,
  accommodationRate: null,
  messOnlyRate: null,
  customFieldsDef: null,
  subOptions: [],
};

const individualEvent = {
  id: 'event-2',
  registrationType: EventRegistrationType.INDIVIDUAL,
  isPublished: true,
  registrationOpen: true,
  capacity: null,
  teamSizeMin: null,
  teamSizeMax: null,
  feeStructure: FeeStructure.FLAT,
  feeFlat: new Prisma.Decimal(100),
  feePerHead: null,
  feeMale: null,
  feeFemale: null,
  hasAccommodation: false,
  accommodationRate: null,
  messOnlyRate: null,
  customFieldsDef: null,
  subOptions: [
    {
      id: 'sub-100m',
      eventId: 'event-2',
      name: '100m',
      type: SubOptionType.INDIVIDUAL,
      maxSelectionsPerReg: 3,
      isActive: true,
    },
    {
      id: 'sub-relay',
      eventId: 'event-2',
      name: '4x100m Relay',
      type: SubOptionType.RELAY,
      maxSelectionsPerReg: 2,
      isActive: true,
    },
  ],
};

describe('RegistrationsService.create', () => {
  let service: RegistrationsService;

  let prisma: {
    event: { findUnique: jest.Mock };
    registration: { count: jest.Mock };
    team: { findUnique: jest.Mock };
    user: { findUniqueOrThrow: jest.Mock };
    $transaction: jest.Mock;
  };

  let tx: {
    registration: { create: jest.Mock };
    registrationSubOption: { createMany: jest.Mock };
    payment: { create: jest.Mock };
  };

  beforeEach(async () => {
    tx = {
      registration: {
        create: jest.fn().mockResolvedValue({
          id: 'reg-1',
          eventId: 'event-1',
          status: 'PENDING_PAYMENT',
        }),
      },
      registrationSubOption: {
        createMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      payment: {
        create: jest.fn().mockResolvedValue({
          id: 'pay-1',
          amount: new Prisma.Decimal(500),
          mode: 'MANUAL_SCREENSHOT',
          status: 'INITIATED',
        }),
      },
    };

    prisma = {
      event: { findUnique: jest.fn() },
      registration: { count: jest.fn().mockResolvedValue(0) },
      team: { findUnique: jest.fn() },
      user: { findUniqueOrThrow: jest.fn() },
      $transaction: jest.fn((fn: (tx: unknown) => unknown) => fn(tx)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        RegistrationsService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: UploadsService,
          useValue: {
            uploadProof: jest
              .fn()
              .mockImplementation(
                (_buf: Buffer, _mime: string, folder: string) =>
                  Promise.resolve({ key: `${folder}/mock-key` }),
              ),
          },
        },
      ],
    }).compile();

    service = moduleRef.get<RegistrationsService>(RegistrationsService);
  });

  it('creates a TEAM registration and computes the FLAT fee', async () => {
    prisma.event.findUnique.mockResolvedValue(flatTeamEvent);
    prisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      eventId: 'event-1',
      captainId: 'user-1',
      isIITP: false,
      declaredSize: 3,
    });

    const result = await service.create('user-1', {
      eventId: 'event-1',
      teamId: 'team-1',
    });

    expect(result.id).toBe('reg-1');

    expect(tx.payment.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining is untyped in @types/jest
        data: expect.objectContaining({ amount: 500 }),
      }),
    );
  });

  it('creates an INDIVIDUAL registration without a teamId', async () => {
    prisma.event.findUnique.mockResolvedValue({
      ...individualEvent,
      subOptions: [],
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue({ isIITP: false });

    await service.create(
      'user-1',
      { eventId: 'event-2', ...individualIdentityDto },
      identityFiles.photoFile,
      identityFiles.idFile,
      identityFiles.secondaryIdFile,
    );

    expect(tx.registration.create).toHaveBeenCalledWith(
      expect.objectContaining({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining is untyped in @types/jest
        data: expect.objectContaining({ userId: 'user-1', teamId: null }),
      }),
    );
  });

  it('throws 400 when an INDIVIDUAL registration is missing identity fields/files', async () => {
    prisma.event.findUnique.mockResolvedValue({
      ...individualEvent,
      subOptions: [],
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue({ isIITP: false });

    await expect(
      service.create('user-1', { eventId: 'event-2' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws 404 when the event does not exist', async () => {
    prisma.event.findUnique.mockResolvedValue(null);
    await expect(service.create('user-1', { eventId: 'nope' })).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws 422 when registration is not open', async () => {
    prisma.event.findUnique.mockResolvedValue({
      ...flatTeamEvent,
      registrationOpen: false,
    });
    await expect(
      service.create('user-1', { eventId: 'event-1', teamId: 'team-1' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws 400 when teamId is missing for a TEAM event', async () => {
    prisma.event.findUnique.mockResolvedValue(flatTeamEvent);
    await expect(
      service.create('user-1', { eventId: 'event-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws 400 when teamId is provided for an INDIVIDUAL event', async () => {
    prisma.event.findUnique.mockResolvedValue(individualEvent);
    await expect(
      service.create('user-1', { eventId: 'event-2', teamId: 'team-1' }),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws 403 when the caller is not the team captain', async () => {
    prisma.event.findUnique.mockResolvedValue(flatTeamEvent);
    prisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      eventId: 'event-1',
      captainId: 'someone-else',
      isIITP: false,
      declaredSize: 3,
    });

    await expect(
      service.create('user-1', { eventId: 'event-1', teamId: 'team-1' }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws 422 when the declared team size is below teamSizeMin', async () => {
    prisma.event.findUnique.mockResolvedValue(flatTeamEvent);
    prisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      eventId: 'event-1',
      captainId: 'user-1',
      isIITP: false,
      declaredSize: 1,
    });

    await expect(
      service.create('user-1', { eventId: 'event-1', teamId: 'team-1' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('throws 409 when the registration already exists (P2002)', async () => {
    prisma.event.findUnique.mockResolvedValue(flatTeamEvent);
    prisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      eventId: 'event-1',
      captainId: 'user-1',
      isIITP: false,
      declaredSize: 3,
    });
    tx.registration.create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError('duplicate', {
        code: 'P2002',
        clientVersion: 'test',
      }),
    );

    await expect(
      service.create('user-1', { eventId: 'event-1', teamId: 'team-1' }),
    ).rejects.toThrow(ConflictException);
  });

  it('accepts subOptionSelections within the individual/relay caps', async () => {
    prisma.event.findUnique.mockResolvedValue(individualEvent);
    prisma.user.findUniqueOrThrow.mockResolvedValue({ isIITP: false });

    await service.create(
      'user-1',
      {
        eventId: 'event-2',
        ...individualIdentityDto,
        subOptionSelections: [
          { subOptionId: 'sub-100m' },
          { subOptionId: 'sub-relay', relayMembers: ['A', 'B', 'C'] },
        ],
      },
      identityFiles.photoFile,
      identityFiles.idFile,
      identityFiles.secondaryIdFile,
    );

    expect(tx.registrationSubOption.createMany).toHaveBeenCalled();
  });

  it('throws 422 when relay selections exceed the shared cap', async () => {
    prisma.event.findUnique.mockResolvedValue({
      ...individualEvent,
      subOptions: [
        ...individualEvent.subOptions,
        {
          id: 'sub-relay-2',
          eventId: 'event-2',
          name: '4x400m Relay',
          type: SubOptionType.RELAY,
          maxSelectionsPerReg: 2,
          isActive: true,
        },
        {
          id: 'sub-relay-3',
          eventId: 'event-2',
          name: 'Mixed Relay',
          type: SubOptionType.RELAY,
          maxSelectionsPerReg: 2,
          isActive: true,
        },
      ],
    });
    prisma.user.findUniqueOrThrow.mockResolvedValue({ isIITP: false });

    await expect(
      service.create(
        'user-1',
        {
          eventId: 'event-2',
          ...individualIdentityDto,
          subOptionSelections: [
            { subOptionId: 'sub-relay', relayMembers: ['A'] },
            { subOptionId: 'sub-relay-2', relayMembers: ['A'] },
            { subOptionId: 'sub-relay-3', relayMembers: ['A'] },
          ],
        },
        identityFiles.photoFile,
        identityFiles.idFile,
        identityFiles.secondaryIdFile,
      ),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('is free (amount 0) for IITP teams regardless of fee structure', async () => {
    prisma.event.findUnique.mockResolvedValue(flatTeamEvent);
    prisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      eventId: 'event-1',
      captainId: 'user-1',
      isIITP: true,
      declaredSize: 3,
    });

    await service.create('user-1', {
      eventId: 'event-1',
      teamId: 'team-1',
    });

    expect(tx.payment.create).toHaveBeenCalledWith(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining is untyped in @types/jest
      expect.objectContaining({ data: expect.objectContaining({ amount: 0 }) }),
    );
  });

  it('validates GENDER_BASED events reject a missing genderDeclared', async () => {
    prisma.event.findUnique.mockResolvedValue({
      ...flatTeamEvent,
      feeStructure: FeeStructure.GENDER_BASED,
      feeFlat: null,
      feeMale: new Prisma.Decimal(6500),
      feeFemale: new Prisma.Decimal(3000),
    });
    prisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      eventId: 'event-1',
      captainId: 'user-1',
      isIITP: false,
      declaredSize: 3,
    });

    await expect(
      service.create('user-1', { eventId: 'event-1', teamId: 'team-1' }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('rejects unknown custom field keys', async () => {
    prisma.event.findUnique.mockResolvedValue({
      ...flatTeamEvent,
      customFieldsDef: [
        { label: 'Roll No.', inputType: 'TEXT', required: true, scope: 'TEAM' },
      ],
    });
    prisma.team.findUnique.mockResolvedValue({
      id: 'team-1',
      eventId: 'event-1',
      captainId: 'user-1',
      isIITP: false,
      declaredSize: 3,
    });

    await expect(
      service.create('user-1', {
        eventId: 'event-1',
        teamId: 'team-1',
        customData: { 'Roll No.': 'A1', unknownField: 'x' },
      }),
    ).rejects.toThrow(BadRequestException);
  });

  describe('accommodation and mess-only add-ons', () => {
    const accommodationTeamEvent = {
      ...flatTeamEvent,
      hasAccommodation: true,
      accommodationRate: new Prisma.Decimal(490),
      messOnlyRate: new Prisma.Decimal(200),
    };

    it('rejects accommodationOpted when the event does not offer it', async () => {
      prisma.event.findUnique.mockResolvedValue(flatTeamEvent); // hasAccommodation: false
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        eventId: 'event-1',
        captainId: 'user-1',
        isIITP: false,
        declaredSize: 3,
      });

      await expect(
        service.create('user-1', {
          eventId: 'event-1',
          teamId: 'team-1',
          accommodationOpted: true,
          accommodationDays: 2,
          accommodationHeadcount: 1,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects messOnlyOpted when the event does not offer it', async () => {
      prisma.event.findUnique.mockResolvedValue(flatTeamEvent);
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        eventId: 'event-1',
        captainId: 'user-1',
        isIITP: false,
        declaredSize: 3,
      });

      await expect(
        service.create('user-1', {
          eventId: 'event-1',
          teamId: 'team-1',
          messOnlyOpted: true,
          accommodationDays: 2,
          messOnlyHeadcount: 1,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('rejects when accommodationHeadcount + messOnlyHeadcount exceeds the declared team size', async () => {
      prisma.event.findUnique.mockResolvedValue(accommodationTeamEvent);
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        eventId: 'event-1',
        captainId: 'user-1',
        isIITP: false,
        declaredSize: 3,
      });

      await expect(
        service.create('user-1', {
          eventId: 'event-1',
          teamId: 'team-1',
          accommodationOpted: true,
          accommodationDays: 2,
          accommodationHeadcount: 2,
          messOnlyOpted: true,
          messOnlyHeadcount: 2,
        }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('stacks accommodation and mess-only charges for different subsets of the team', async () => {
      prisma.event.findUnique.mockResolvedValue(accommodationTeamEvent);
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        eventId: 'event-1',
        captainId: 'user-1',
        isIITP: false,
        declaredSize: 5,
      });

      await service.create('user-1', {
        eventId: 'event-1',
        teamId: 'team-1',
        accommodationOpted: true,
        accommodationDays: 2,
        accommodationHeadcount: 3,
        messOnlyOpted: true,
        messOnlyHeadcount: 2,
      });

      // FLAT feeFlat (500) + accommodation (490*2*3=2940) + messOnly (200*2*2=800)
      expect(tx.payment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment -- expect.objectContaining is untyped in @types/jest
          data: expect.objectContaining({ amount: 500 + 2940 + 800 }),
        }),
      );
    });
  });
});
