import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { TeamsService } from './teams.service';

@Controller('admin/teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminTeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  @RequirePermission(AdminService.TEAMS, 'read')
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.teamsService.listAll(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }
}
