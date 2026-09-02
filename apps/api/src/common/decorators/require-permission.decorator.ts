import { SetMetadata } from '@nestjs/common';
import { AdminService } from '@prisma/client';

export type PermissionAction = 'read' | 'write' | 'delete';

export interface RequiredPermission {
  service: AdminService;
  action: PermissionAction;
}

export const PERMISSION_KEY = 'permission';
export const RequirePermission = (
  service: AdminService,
  action: PermissionAction,
) => SetMetadata(PERMISSION_KEY, { service, action } as RequiredPermission);
