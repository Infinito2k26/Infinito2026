import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { REFRESH_TOKEN_STORE } from '../auth/refresh-token-store.interface';
import type { RefreshTokenStore } from '../auth/refresh-token-store.interface';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshStore: RefreshTokenStore,
  ) {}

  async listUsers(page = 1, limit = 20, search?: string, role?: string) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * limit;

    if (role && !Object.values(UserRole).includes(role as UserRole)) {
      throw new BadRequestException(
        `Invalid role. Allowed values: ${Object.values(UserRole).join(', ')}`,
      );
    }

    const where: Prisma.UserWhereInput = {
      ...(role ? { role: role as UserRole } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
              { college: { contains: search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          college: true,
          isIITP: true,
          isEmailVerified: true,
          bannedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUserDetail(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      omit: { passwordHash: true },
      include: {
        registrations: {
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { id: true, name: true } },
            payments: { orderBy: { createdAt: 'desc' } },
          },
        },
        captainedTeams: {
          select: { id: true, name: true, eventId: true, collegeName: true },
        },
        caProfile: true,
        caApplications: { orderBy: { createdAt: 'desc' } },
        credentials: {
          include: {
            scanLogs: { orderBy: { createdAt: 'desc' }, take: 20 },
          },
        },
        merchOrders: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            status: true,
            paymentStatus: true,
            totalAmount: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRole(actorId: string, targetId: string, role: UserRole) {
    if (actorId === targetId) {
      throw new ForbiddenException('You cannot change your own role');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    if (target.role === 'SUPER_ADMIN' && role !== 'SUPER_ADMIN') {
      const remainingSuperAdmins = await this.prisma.user.count({
        where: { role: 'SUPER_ADMIN', id: { not: targetId } },
      });
      if (remainingSuperAdmins === 0) {
        throw new ForbiddenException(
          'Cannot demote the last remaining SUPER_ADMIN',
        );
      }
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetId },
        data: { role },
        omit: { passwordHash: true },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          actorUserId: actorId,
          targetUserId: targetId,
          action: 'ROLE_CHANGE',
          previousValue: target.role,
          newValue: role,
        },
      }),
    ]);

    await this.refreshStore.revoke(targetId);
    return updated;
  }

  async updateStatus(actorId: string, targetId: string, banned: boolean) {
    if (actorId === targetId) {
      throw new ForbiddenException('You cannot ban or unban your own account');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: targetId },
    });
    if (!target) {
      throw new NotFoundException('User not found');
    }

    const bannedAt = banned ? new Date() : null;

    const [updated] = await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: targetId },
        data: { bannedAt },
        omit: { passwordHash: true },
      }),
      this.prisma.adminAuditLog.create({
        data: {
          actorUserId: actorId,
          targetUserId: targetId,
          action: banned ? 'BAN' : 'UNBAN',
          previousValue: target.bannedAt ? 'BANNED' : 'ACTIVE',
          newValue: banned ? 'BANNED' : 'ACTIVE',
        },
      }),
    ]);

    await this.refreshStore.revoke(targetId);
    return updated;
  }
}
