import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesService } from './roles.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@Controller('admin/roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
@SkipThrottle()
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  async listRoles() {
    return this.rolesService.listRoles();
  }

  @Get(':id')
  async getRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.getRole(id);
  }

  @Post()
  async createRole(@Body() dto: CreateRoleDto) {
    return this.rolesService.createRole(dto);
  }

  @Patch(':id')
  async updateRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rolesService.updateRole(id, dto);
  }

  @Delete(':id')
  async deleteRole(@Param('id', ParseUUIDPipe) id: string) {
    return this.rolesService.deleteRole(id);
  }
}
