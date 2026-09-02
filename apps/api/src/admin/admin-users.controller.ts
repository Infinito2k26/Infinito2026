import {
  Controller,
  Get,
  Patch,
  Param,
  ParseUUIDPipe,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminUsersService } from './admin-users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UpdateUserCustomRoleDto } from './dto/update-user-custom-role.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@SkipThrottle()
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  async listUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('role') role?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.adminUsersService.listUsers(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      search,
      role,
    );
  }

  @Get(':id')
  async getUserDetail(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminUsersService.getUserDetail(id);
  }

  @Patch(':id/role')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminUsersService.updateRole(req.user.id, id, dto.role);
  }

  @Patch(':id/custom-role')
  @Roles(UserRole.SUPER_ADMIN)
  async updateCustomRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserCustomRoleDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminUsersService.updateCustomRole(
      req.user.id,
      id,
      dto.customRoleId,
    );
  }

  @Patch(':id/status')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.adminUsersService.updateStatus(req.user.id, id, dto.banned);
  }
}
