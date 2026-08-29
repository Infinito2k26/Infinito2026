import { Test } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

import { TeamsService } from './teams.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

describe('TeamsService', () => {
  let service: TeamsService;

  let prisma: {
    event: { findUnique: jest.Mock };
    user: { findUniqueOrThrow: jest.Mock };
    team: { findUnique: jest.Mock; update: jest.Mock };
    $transaction: jest.Mock;
  };

  let uploadsService: { uploadProof: jest.Mock };

  const file = { buffer: Buffer.from('fake'), mimetype: 'image/png' };

  beforeEach(async () => {
    prisma = {
      event: { findUnique: jest.fn() },
      user: { findUniqueOrThrow: jest.fn() },
      team: { findUnique: jest.fn(), update: jest.fn() },
      $transaction: jest.fn(),
    };

    uploadsService = {
      uploadProof: jest
        .fn()
        .mockResolvedValue({ key: 'participant-photo/abc' }),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        TeamsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploadsService },
      ],
    }).compile();

    service = moduleRef.get<TeamsService>(TeamsService);
  });

  describe('createTeam', () => {
    const dto = {
      eventId: 'evt-1',
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

    it('throws NotFoundException when the team does not exist', async () => {
      prisma.team.findUnique.mockResolvedValue(null);

      await expect(
        service.join('team-1', dto, 'user-1', file, file),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects a wrong invite code', async () => {
      prisma.team.findUnique.mockResolvedValue({
        id: 'team-1',
        deletedAt: null,
        inviteCode: 'DIFFERENT',
        event: { teamSizeMax: 5 },
      });

      await expect(
        service.join('team-1', dto, 'user-1', file, file),
      ).rejects.toThrow(ForbiddenException);
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

      await expect(
        service.join('team-1', dto, 'user-1', file, file),
      ).rejects.toThrow(ConflictException);
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

      const result = await service.join('team-1', dto, 'user-1', file, file);

      expect(result).toEqual(createdParticipant);
      expect(capturedData).toMatchObject({ teamId: 'team-1', role: 'PLAYER' });
    });
  });
});
