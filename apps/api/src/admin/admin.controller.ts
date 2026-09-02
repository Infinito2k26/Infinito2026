import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from './admin.service';
import {
  CreateBrandDto,
  UpdateBrandDto,
  CreateTaskDto,
  UpdateTaskDto,
  VerifyTaskDto,
  ReviewApplicationDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { AdminService as AdminServiceEnum } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('brands')
  @RequirePermission(AdminServiceEnum.CA, 'write')
  async createBrand(@Body() dto: CreateBrandDto) {
    return this.adminService.createBrand(dto);
  }

  @Get('brands')
  @RequirePermission(AdminServiceEnum.CA, 'read')
  async getBrands() {
    return this.adminService.getBrands();
  }

  @Patch('brands/:id')
  @RequirePermission(AdminServiceEnum.CA, 'write')
  async updateBrand(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.adminService.updateBrand(id, dto);
  }

  @Post('ca-tasks')
  @RequirePermission(AdminServiceEnum.CA, 'write')
  async createTask(@Body() dto: CreateTaskDto) {
    return this.adminService.createTask(dto);
  }

  @Get('ca-tasks')
  @RequirePermission(AdminServiceEnum.CA, 'read')
  async getTasks() {
    return this.adminService.getTasks();
  }

  @Get('ca-tasks/:id/assignments')
  @RequirePermission(AdminServiceEnum.CA, 'read')
  async getTaskAssignments(
    @Param('id', ParseUUIDPipe) taskId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.adminService.getTaskAssignments(
      taskId,
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      status,
    );
  }

  @Patch('ca-tasks/:id')
  @RequirePermission(AdminServiceEnum.CA, 'write')
  async updateTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.adminService.updateTask(id, dto);
  }

  @Patch('ca-task-assignments/:id/verify')
  @RequirePermission(AdminServiceEnum.CA, 'write')
  async verifyTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user.id;
    return this.adminService.verifyTask(id, dto, adminId);
  }

  @Get('ca-applications')
  @RequirePermission(AdminServiceEnum.CA, 'read')
  async getApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.adminService.listApplications(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      status,
    );
  }

  @Patch('ca-applications/:id/review')
  @RequirePermission(AdminServiceEnum.CA, 'write')
  async reviewApplication(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user.id;
    return this.adminService.reviewApplication(id, dto, adminId);
  }
}
