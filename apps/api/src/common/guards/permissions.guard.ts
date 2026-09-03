import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { RequestUser } from '../../auth/strategies/jwt.strategy';
import { PrismaService } from '../../prisma/prisma.service';
import {
  PERMISSION_KEY,
  RequiredPermission,
} from '../decorators/require-permission.decorator';

const ACTION_FIELD = {
  read: 'canRead',
  write: 'canWrite',
  delete: 'canDelete',
} as const;

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<
      RequiredPermission | undefined
    >(PERMISSION_KEY, [context.getHandler(), context.getClass()]);
    if (!required) return true;

    interface AuthenticatedRequest extends Request {
      user?: RequestUser;
    }

    const { user } = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!user) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (user.role === UserRole.SUPER_ADMIN || user.role === UserRole.ADMIN) {
      return true;
    }

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        customRole: {
          select: {
            deletedAt: true,
            permissions: {
              where: { service: required.service },
              select: { canRead: true, canWrite: true, canDelete: true },
            },
          },
        },
      },
    });

    const permission = dbUser?.customRole?.deletedAt
      ? undefined
      : dbUser?.customRole?.permissions[0];

    if (!permission || !permission[ACTION_FIELD[required.action]]) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
