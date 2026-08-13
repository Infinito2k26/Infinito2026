import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { AdminUsersService } from './admin-users.service';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Patch(':id/role')
  async updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.adminUsersService.updateRole(id, dto.role);
  }
}
