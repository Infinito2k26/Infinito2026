import { Test } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

import { AdminUsersService } from './admin-users.service';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_TOKEN_STORE } from '../auth/refresh-token-store.interface';

describe('AdminUsersService', () => {
  let service: AdminUsersService;

  let prisma: {
    user: {
      findMany: jest.Mock<Promise<unknown>, [unknown]>;
      findUnique: jest.Mock<Promise<unknown>, [unknown]>;
      update: jest.Mock<Promise<unknown>, [unknown]>;
      count: jest.Mock<Promise<number>, [unknown]>;
    };
    adminAuditLog: {
      create: jest.Mock<Promise<unknown>, [unknown]>;
    };
    $transaction: jest.Mock;
  };
  let refreshStore: { revoke: jest.Mock };

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn<Promise<unknown>, [unknown]>(),
        findUnique: jest.fn<Promise<unknown>, [unknown]>(),
        update: jest.fn<Promise<unknown>, [unknown]>(),
        count: jest.fn<Promise<number>, [unknown]>(),
      },
      adminAuditLog: {
        create: jest.fn<Promise<unknown>, [unknown]>(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };

    refreshStore = { revoke: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: REFRESH_TOKEN_STORE, useValue: refreshStore },
      ],
    }).compile();

    service = moduleRef.get<AdminUsersService>(AdminUsersService);
  });

  describe('listUsers', () => {
    it('rejects an invalid role filter', async () => {
      await expect(
        service.listUsers(1, 20, undefined, 'NOT_A_ROLE'),
      ).rejects.toThrow();
    });

    it('searches across name/email/college', async () => {
      prisma.user.findMany.mockResolvedValue([]);
      prisma.user.count.mockResolvedValue(0);

      await service.listUsers(1, 20, 'ansh');

      const call = prisma.user.findMany.mock.calls[0][0] as {
        where: { OR: unknown[] };
      };
      expect(call.where.OR).toEqual([
        { name: { contains: 'ansh', mode: 'insensitive' } },
        { email: { contains: 'ansh', mode: 'insensitive' } },
        { college: { contains: 'ansh', mode: 'insensitive' } },
      ]);
    });
  });

  describe('getUserDetail', () => {
    it('throws when the user does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(service.getUserDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateRole', () => {
    it('rejects an admin changing their own role', async () => {
      await expect(
        service.updateRole('admin-1', 'admin-1', 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects demoting the last remaining SUPER_ADMIN', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'target-1',
        role: 'SUPER_ADMIN',
      });
      prisma.user.count.mockResolvedValue(0);

      await expect(
        service.updateRole('admin-1', 'target-1', 'ADMIN'),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('allows demoting a SUPER_ADMIN when another one remains', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'target-1',
        role: 'SUPER_ADMIN',
      });
      prisma.user.count.mockResolvedValue(1);
      prisma.user.update.mockResolvedValue({ id: 'target-1', role: 'ADMIN' });

      await service.updateRole('admin-1', 'target-1', 'ADMIN');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: 'target-1' },
        data: { role: 'ADMIN' },
        omit: { passwordHash: true },
      });
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorUserId: 'admin-1',
          targetUserId: 'target-1',
          action: 'ROLE_CHANGE',
          previousValue: 'SUPER_ADMIN',
          newValue: 'ADMIN',
        },
      });
      expect(refreshStore.revoke).toHaveBeenCalledWith('target-1');
    });

    it('throws when the target does not exist', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('admin-1', 'missing', 'ADMIN'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('rejects an admin banning their own account', async () => {
      await expect(
        service.updateStatus('admin-1', 'admin-1', true),
      ).rejects.toThrow(ForbiddenException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('bans a user, audit-logs it, and revokes their session', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'target-1',
        bannedAt: null,
      });
      prisma.user.update.mockResolvedValue({
        id: 'target-1',
        bannedAt: new Date(),
      });

      await service.updateStatus('admin-1', 'target-1', true);

      const call = prisma.user.update.mock.calls[0][0] as {
        data: { bannedAt: Date | null };
      };
      expect(call.data.bannedAt).toBeInstanceOf(Date);
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorUserId: 'admin-1',
          targetUserId: 'target-1',
          action: 'BAN',
          previousValue: 'ACTIVE',
          newValue: 'BANNED',
        },
      });
      expect(refreshStore.revoke).toHaveBeenCalledWith('target-1');
    });

    it('unbans a user', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'target-1',
        bannedAt: new Date(),
      });
      prisma.user.update.mockResolvedValue({ id: 'target-1', bannedAt: null });

      await service.updateStatus('admin-1', 'target-1', false);

      const call = prisma.user.update.mock.calls[0][0] as {
        data: { bannedAt: Date | null };
      };
      expect(call.data.bannedAt).toBeNull();
      expect(prisma.adminAuditLog.create).toHaveBeenCalledWith({
        data: {
          actorUserId: 'admin-1',
          targetUserId: 'target-1',
          action: 'UNBAN',
          previousValue: 'BANNED',
          newValue: 'ACTIVE',
        },
      });
    });
  });
});
