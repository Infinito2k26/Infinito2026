import { Test } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';

import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

describe('TeamsService', () => {
  let service: TeamsService;

  let prisma: {
    event: { findUnique: jest.Mock };
    user: { findUniqueOrThrow: jest.Mock };
    team: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
      findMany: jest.Mock;
    };
    participant: { findUnique: jest.Mock };
    $transaction: jest.Mock;
  };

  let uploadsService: { uploadProof: jest.Mock };
  let paymentConfirmedQueue: { add: jest.Mock };

  const file = { buffer: Buffer.from('fake'), mimetype: 'image/png' };

  beforeEach(async () => {
    prisma = {
      event: { findUnique: jest.fn() },
      user: { findUniqueOrThrow: jest.fn() },
      team: {
        findUnique: jest.fn(),
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        findMany: jest.fn(),
      },
      participant: { findUnique: jest.fn() },
      $transaction: jest.fn(),
    };

    uploadsService = {
      uploadProof: jest
        .fn()
        .mockResolvedValue({ key: 'participant-photo/abc' }),
    };

    paymentConfirmedQueue = { add: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploadsService },
        {
          provide: getQueueToken('payment-confirmed'),
          useValue: paymentConfirmedQueue,
        },
      ],
    }).compile();

    service = moduleRef.get<TeamsService>(TeamsService);
  });

  describe('createTeam', () => {
    const dto = {
      eventId: 'evt-1',
      declaredSize: 4,
      name: 'Team A',
      collegeName: 'IIT Patna',
      idType: 'COLLEGE_ID',
      idNumber: '12345',
    } as never;

    it('throws NotFoundException when the event does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.createTeam('user-1', dto, file, file),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects creating a team for an unpublished event', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        isPublished: false,
      });

      await expect(
        service.createTeam('user-1', dto, file, file),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(uploadsService.uploadProof).not.toHaveBeenCalled();
    });

    it('rejects a declaredSize below the event teamSizeMin', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        isPublished: true,
        teamSizeMin: 5,
        teamSizeMax: 10,
      });

      await expect(
        service.createTeam('user-1', dto, file, file),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('rejects a declaredSize above the event teamSizeMax', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        isPublished: true,
        teamSizeMin: 1,
        teamSizeMax: 3,
      });

      await expect(
        service.createTeam('user-1', dto, file, file),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('rejects a second team for the same event and captain', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        isPublished: true,
        teamSizeMin: 1,
        teamSizeMax: 10,
      });
      prisma.team.findFirst.mockResolvedValue({ id: 'existing-team' });

      await expect(
        service.createTeam('user-1', dto, file, file),
      ).rejects.toThrow(ConflictException);
      expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
      expect(uploadsService.uploadProof).not.toHaveBeenCalled();
    });

    // No self-declared IITP waiver — every team pays, regardless of what a
    // stale/spoofed dto might carry (the DTO itself no longer accepts this
    // field, but the service must not trust it even if one snuck through).
    it('always creates the team with isIITP: false', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        isPublished: true,
        teamSizeMin: 1,
        teamSizeMax: 10,
      });
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        name: 'Captain One',
        phone: '9999999999',
      });

      let capturedData: { isIITP: boolean } | undefined;
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          team: {
            create: (args: { data: { isIITP: boolean } }) => {
              capturedData = args.data;
              return { id: 'team-1', ...args.data };
            },
          },
          participant: { create: jest.fn().mockResolvedValue({ id: 'p-1' }) },
        }),
      );

      const spoofedDto = { ...(dto as object), isIITP: true } as never;
      await service.createTeam('user-1', spoofedDto, file, file);

      expect(capturedData?.isIITP).toBe(false);
    });
  });

  describe('rotateInviteCode', () => {
    it('throws NotFoundException when the team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(
        service.rotateInviteCode('team-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects rotation from a caller who is not the captain', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'captain-1',
      });

      await expect(
        service.rotateInviteCode('team-1', 'someone-else'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.team.update).not.toHaveBeenCalled();
    });
  });

  describe('join', () => {
    const dto = {
      inviteCode: 'ABC123',
      idType: 'COLLEGE_ID',
      idNumber: '999',
    } as never;

    it('throws NotFoundException when no team matches the invite code', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.join(dto, 'user-1', file, file)).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.team.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { inviteCode: 'ABC123' } }),
      );
      expect(prisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    });

    it('rejects joining once the roster has reached teamSizeMax', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        inviteCode: 'ABC123',
        event: { teamSizeMax: 5 },
      });
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        name: 'Player One',
        phone: '9999999999',
      });

      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          participant: {
            count: jest.fn().mockResolvedValue(5),
            create: jest.fn(),
          },
        }),
      );

      await expect(service.join(dto, 'user-1', file, file)).rejects.toThrow(
        ConflictException,
      );
    });

    it('adds a PLAYER participant when the roster has room', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        inviteCode: 'ABC123',
        event: { teamSizeMax: 5 },
      });
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        name: 'Player One',
        phone: '9999999999',
      });

      const createdParticipant = { id: 'p-1', role: 'PLAYER' };
      let capturedData: { teamId: string; role: string } | undefined;
      const create = (args: { data: { teamId: string; role: string } }) => {
        capturedData = args.data;
        return Promise.resolve(createdParticipant);
      };
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          participant: {
            count: jest.fn().mockResolvedValue(2),
            create,
          },
        }),
      );

      const result = await service.join(dto, 'user-1', file, file);

      expect(result).toEqual(createdParticipant);
      expect(capturedData).toMatchObject({ teamId: 'team-1', role: 'PLAYER' });
      expect(paymentConfirmedQueue.add).not.toHaveBeenCalled();
    });

    it('re-enqueues credential issuance when joining an already-confirmed team', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        inviteCode: 'ABC123',
        event: { teamSizeMax: 5 },
        registration: { id: 'reg-1', status: 'CONFIRMED' },
      });
      prisma.user.findUniqueOrThrow.mockResolvedValue({
        name: 'Player One',
        phone: '9999999999',
      });
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          participant: {
            count: jest.fn().mockResolvedValue(2),
            create: jest.fn().mockResolvedValue({ id: 'p-1', role: 'PLAYER' }),
          },
        }),
      );

      await service.join(dto, 'user-1', file, file);

      expect(paymentConfirmedQueue.add).toHaveBeenCalledWith(
        'payment-confirmed',
        { registrationId: 'reg-1' },
      );
    });
  });

  describe('listMine', () => {
    it('queries teams captained OR joined by the user', async () => {
      prisma.team.findMany.mockResolvedValue([]);

      await service.listMine('user-1');

      expect(prisma.team.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            deletedAt: null,
            OR: [
              { captainId: 'user-1' },
              { participants: { some: { userId: 'user-1' } } },
            ],
          },
        }),
      );
    });

    it('tags the caller as CAPTAIN and keeps the invite code visible', async () => {
      prisma.team.findMany.mockResolvedValue([
        {
          id: 'team-1',
          name: 'Team A',
          captainId: 'user-1',
          inviteCode: 'ABC123',
        },
      ]);

      const [result] = await service.listMine('user-1');

      expect(result).toMatchObject({ role: 'CAPTAIN', inviteCode: 'ABC123' });
      expect(result).not.toHaveProperty('captainId');
    });

    it('tags a joined-but-not-captain caller as MEMBER and strips the invite code', async () => {
      prisma.team.findMany.mockResolvedValue([
        {
          id: 'team-1',
          name: 'Team A',
          captainId: 'someone-else',
          inviteCode: 'ABC123',
        },
      ]);

      const [result] = await service.listMine('user-1');

      expect(result).toMatchObject({ role: 'MEMBER', inviteCode: null });
    });
  });

  describe('updateTeam', () => {
    const dto = { name: 'New Name' } as never;

    it('throws NotFoundException when the team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(service.updateTeam('team-1', 'user-1', dto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects edits from a caller who is not the captain', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'captain-1',
        event: { teamSizeMin: 1, teamSizeMax: 10 },
        registration: null,
        _count: { participants: 1 },
      });

      await expect(
        service.updateTeam('team-1', 'someone-else', dto),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.team.update).not.toHaveBeenCalled();
    });

    it('rejects edits once the team has a registration', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
        event: { teamSizeMin: 1, teamSizeMax: 10 },
        registration: { id: 'reg-1' },
        _count: { participants: 1 },
      });

      await expect(service.updateTeam('team-1', 'user-1', dto)).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.team.update).not.toHaveBeenCalled();
    });

    it('rejects a declaredSize below the current roster count', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
        event: { teamSizeMin: 1, teamSizeMax: 10 },
        registration: null,
        _count: { participants: 4 },
      });

      await expect(
        service.updateTeam('team-1', 'user-1', { declaredSize: 3 }),
      ).rejects.toThrow(UnprocessableEntityException);
      expect(prisma.team.update).not.toHaveBeenCalled();
    });

    it('updates the team when the caller is the captain and it is unregistered', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
        event: { teamSizeMin: 1, teamSizeMax: 10 },
        registration: null,
        _count: { participants: 1 },
      });
      prisma.team.update.mockResolvedValue({ id: 'team-1', name: 'New Name' });

      const result = await service.updateTeam('team-1', 'user-1', dto);

      expect(result).toEqual({ id: 'team-1', name: 'New Name' });
      expect(prisma.team.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'team-1' } }),
      );
    });

    // No self-declared IITP waiver on edit either — UpdateTeamDto no longer
    // accepts the field, but the service must not write one even if a
    // stale/spoofed dto carries it.
    it('never writes isIITP, even if a spoofed dto carries it', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
        event: { teamSizeMin: 1, teamSizeMax: 10 },
        registration: null,
        _count: { participants: 1 },
      });
      let capturedData: object | undefined;
      prisma.team.update.mockImplementation((args: { data: object }) => {
        capturedData = args.data;
        return Promise.resolve({ id: 'team-1', name: 'New Name' });
      });

      const spoofedDto = { ...(dto as object), isIITP: true } as never;
      await service.updateTeam('team-1', 'user-1', spoofedDto);

      expect(capturedData).not.toHaveProperty('isIITP');
    });
  });

  describe('removeParticipant', () => {
    it('throws NotFoundException when the team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(
        service.removeParticipant('team-1', 'p-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects removal from a caller who is not the captain', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'captain-1',
      });

      await expect(
        service.removeParticipant('team-1', 'p-1', 'someone-else'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('throws NotFoundException when the participant is not on this team', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
      });
      prisma.participant.findUnique.mockResolvedValue({
        id: 'p-1',
        teamId: 'other-team',
        role: 'PLAYER',
      });

      await expect(
        service.removeParticipant('team-1', 'p-1', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects removing the captain', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
      });
      prisma.participant.findUnique.mockResolvedValue({
        id: 'p-1',
        teamId: 'team-1',
        role: 'CAPTAIN',
      });

      await expect(
        service.removeParticipant('team-1', 'p-1', 'user-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('deletes the participant and their credential/scan logs when present', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
      });
      prisma.participant.findUnique.mockResolvedValue({
        id: 'p-1',
        teamId: 'team-1',
        role: 'PLAYER',
      });

      const credential = {
        findUnique: jest.fn().mockResolvedValue({ id: 'cred-1' }),
      };
      const scanLog = { deleteMany: jest.fn() };
      const credentialDelete = jest.fn();
      const participantDelete = jest.fn();
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          credential: { ...credential, delete: credentialDelete },
          scanLog,
          participant: { delete: participantDelete },
        }),
      );

      await service.removeParticipant('team-1', 'p-1', 'user-1');

      expect(scanLog.deleteMany).toHaveBeenCalledWith({
        where: { credentialId: 'cred-1' },
      });
      expect(credentialDelete).toHaveBeenCalledWith({
        where: { id: 'cred-1' },
      });
      expect(participantDelete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });

    it('skips credential cleanup when the participant has no credential', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        captainId: 'user-1',
      });
      prisma.participant.findUnique.mockResolvedValue({
        id: 'p-1',
        teamId: 'team-1',
        role: 'PLAYER',
      });

      const credentialDelete = jest.fn();
      const participantDelete = jest.fn();
      prisma.$transaction.mockImplementation((fn: (tx: unknown) => unknown) =>
        fn({
          credential: {
            findUnique: jest.fn().mockResolvedValue(null),
            delete: credentialDelete,
          },
          scanLog: { deleteMany: jest.fn() },
          participant: { delete: participantDelete },
        }),
      );

      await service.removeParticipant('team-1', 'p-1', 'user-1');

      expect(credentialDelete).not.toHaveBeenCalled();
      expect(participantDelete).toHaveBeenCalledWith({ where: { id: 'p-1' } });
    });
  });
});
