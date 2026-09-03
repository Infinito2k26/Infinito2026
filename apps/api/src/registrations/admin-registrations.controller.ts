import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { RegistrationsService } from './registrations.service';

@Controller('admin/registrations')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminRegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Get()
  @RequirePermission(AdminService.REGISTRATIONS, 'read')
  async list(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.registrationsService.listRegistrations(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      status,
    );
  }
}
