import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
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
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('brands')
  async createBrand(@Body() dto: CreateBrandDto) {
    return this.adminService.createBrand(dto);
  }

  @Get('brands')
  async getBrands() {
    return this.adminService.getBrands();
  }

  @Patch('brands/:id')
  async updateBrand(@Param('id') id: string, @Body() dto: UpdateBrandDto) {
    return this.adminService.updateBrand(id, dto);
  }

  @Post('ca-tasks')
  async createTask(@Body() dto: CreateTaskDto) {
    return this.adminService.createTask(dto);
  }

  @Get('ca-tasks')
  async getTasks() {
    return this.adminService.getTasks();
  }

  @Get('ca-tasks/:id/assignments')
  async getTaskAssignments(
    @Param('id') taskId: string,
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
  async updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.adminService.updateTask(id, dto);
  }

  @Patch('ca-task-assignments/:id/verify')
  async verifyTask(
    @Param('id') id: string,
    @Body() dto: VerifyTaskDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user.id;
    return this.adminService.verifyTask(id, dto, adminId);
  }

  @Get('ca-applications')
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
  async reviewApplication(
    @Param('id') id: string,
    @Body() dto: ReviewApplicationDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user.id;
    return this.adminService.reviewApplication(id, dto, adminId);
  }
}
