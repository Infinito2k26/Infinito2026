import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { IdentityService } from './identity.service';

@Controller('admin/scans')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminScansController {
  constructor(private readonly identityService: IdentityService) {}

  @Get()
  @RequirePermission(AdminService.IDENTITY, 'read')
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('gate') gate?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.identityService.listScans(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      gate,
    );
  }
}
