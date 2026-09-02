import { Test } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { RolesService } from './roles.service';
import { PrismaService } from '../prisma/prisma.service';

describe('RolesService', () => {
  let service: RolesService;

  let prisma: {
    customRole: {
      findMany: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock<Promise<unknown>, [unknown]>;
    };
    rolePermission: {
      deleteMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      customRole: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn<Promise<unknown>, [unknown]>(),
      },
      rolePermission: {
        deleteMany: jest.fn(),
      },
      $transaction: jest.fn((cb: (tx: unknown) => unknown) => cb(prisma)),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [RolesService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get<RolesService>(RolesService);
  });

  describe('createRole', () => {
    it('creates a role with its permissions', async () => {
      prisma.customRole.create.mockResolvedValue({
        id: 'role-1',
        name: 'Registration Team',
        permissions: [],
      });

      await service.createRole({
        name: 'Registration Team',
        permissions: [
          {
            service: 'EVENTS',
            canRead: true,
            canWrite: true,
            canDelete: false,
          },
        ],
      });

      expect(prisma.customRole.create).toHaveBeenCalledWith({
        data: {
          name: 'Registration Team',
          description: undefined,
          permissions: {
            create: [
              {
                service: 'EVENTS',
                canRead: true,
                canWrite: true,
                canDelete: false,
              },
            ],
          },
        },
        include: { permissions: true },
      });
    });

    it('rejects a duplicate role name', async () => {
      prisma.customRole.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('duplicate', {
          code: 'P2002',
          clientVersion: '0',
        }),
      );

      await expect(
        service.createRole({ name: 'Existing', permissions: [] }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('updateRole', () => {
    it('throws when the role does not exist', async () => {
      prisma.customRole.findFirst.mockResolvedValue(null);

      await expect(
        service.updateRole('missing', { name: 'New name' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('replaces permission rows when permissions are provided', async () => {
      prisma.customRole.findFirst.mockResolvedValue({
        id: 'role-1',
        permissions: [],
        _count: { users: 0 },
      });
      prisma.customRole.update.mockResolvedValue({
        id: 'role-1',
        permissions: [],
      });

      await service.updateRole('role-1', {
        permissions: [
          {
            service: 'PAYMENTS',
            canRead: true,
            canWrite: false,
            canDelete: false,
          },
        ],
      });

      expect(prisma.rolePermission.deleteMany).toHaveBeenCalledWith({
        where: { roleId: 'role-1' },
      });
      expect(prisma.customRole.update).toHaveBeenCalledWith({
        where: { id: 'role-1' },
        data: {
          name: undefined,
          description: undefined,
          permissions: {
            create: [
              {
                service: 'PAYMENTS',
                canRead: true,
                canWrite: false,
                canDelete: false,
              },
            ],
          },
        },
        include: { permissions: true },
      });
    });
  });

  describe('deleteRole', () => {
    it('throws when the role does not exist', async () => {
      prisma.customRole.findFirst.mockResolvedValue(null);

      await expect(service.deleteRole('missing')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects deleting a role still assigned to users', async () => {
      prisma.customRole.findFirst.mockResolvedValue({
        id: 'role-1',
        _count: { users: 2 },
      });

      await expect(service.deleteRole('role-1')).rejects.toThrow(
        ConflictException,
      );
      expect(prisma.customRole.update).not.toHaveBeenCalled();
    });

    it('soft-deletes an unassigned role', async () => {
      prisma.customRole.findFirst.mockResolvedValue({
        id: 'role-1',
        _count: { users: 0 },
      });
      prisma.customRole.update.mockResolvedValue({ id: 'role-1' });

      await service.deleteRole('role-1');

      const call = prisma.customRole.update.mock.calls[0][0] as {
        data: { deletedAt: Date };
      };
      expect(call.data.deletedAt).toBeInstanceOf(Date);
    });
  });
});
