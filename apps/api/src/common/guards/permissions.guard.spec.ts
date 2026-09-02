import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';

import { PermissionsGuard } from './permissions.guard';
import { PrismaService } from '../../prisma/prisma.service';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let prisma: { user: { findUnique: jest.Mock } };

  const makeContext = (user?: { id: string; role: UserRole }) =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    prisma = { user: { findUnique: jest.fn() } };
    guard = new PermissionsGuard(
      reflector as unknown as Reflector,
      prisma as unknown as PrismaService,
    );
  });

  it('allows the request through when no permission metadata is set', async () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(makeContext({ id: 'u1', role: UserRole.PARTICIPANT })),
    ).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows SUPER_ADMIN regardless of custom role', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      service: 'EVENTS',
      action: 'write',
    });

    await expect(
      guard.canActivate(makeContext({ id: 'u1', role: UserRole.SUPER_ADMIN })),
    ).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('allows ADMIN regardless of custom role', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      service: 'EVENTS',
      action: 'delete',
    });

    await expect(
      guard.canActivate(makeContext({ id: 'u1', role: UserRole.ADMIN })),
    ).resolves.toBe(true);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('denies a PARTICIPANT with no custom role', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      service: 'EVENTS',
      action: 'read',
    });
    prisma.user.findUnique.mockResolvedValue({ customRole: null });

    await expect(
      guard.canActivate(makeContext({ id: 'u1', role: UserRole.PARTICIPANT })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('denies a PARTICIPANT whose custom role lacks the required action', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      service: 'EVENTS',
      action: 'write',
    });
    prisma.user.findUnique.mockResolvedValue({
      customRole: {
        deletedAt: null,
        permissions: [{ canRead: true, canWrite: false, canDelete: false }],
      },
    });

    await expect(
      guard.canActivate(makeContext({ id: 'u1', role: UserRole.PARTICIPANT })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('allows a PARTICIPANT whose custom role grants the required action', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      service: 'EVENTS',
      action: 'read',
    });
    prisma.user.findUnique.mockResolvedValue({
      customRole: {
        deletedAt: null,
        permissions: [{ canRead: true, canWrite: false, canDelete: false }],
      },
    });

    await expect(
      guard.canActivate(makeContext({ id: 'u1', role: UserRole.PARTICIPANT })),
    ).resolves.toBe(true);
  });

  it('denies access via a soft-deleted custom role', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      service: 'EVENTS',
      action: 'read',
    });
    prisma.user.findUnique.mockResolvedValue({
      customRole: {
        deletedAt: new Date(),
        permissions: [{ canRead: true, canWrite: true, canDelete: true }],
      },
    });

    await expect(
      guard.canActivate(makeContext({ id: 'u1', role: UserRole.PARTICIPANT })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('denies when there is no authenticated user', async () => {
    reflector.getAllAndOverride.mockReturnValue({
      service: 'EVENTS',
      action: 'read',
    });

    await expect(guard.canActivate(makeContext(undefined))).rejects.toThrow(
      ForbiddenException,
    );
  });
});
