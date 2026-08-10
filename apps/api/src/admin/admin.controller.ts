import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import {
  CreateBrandDto,
  UpdateBrandDto,
  CreateTaskDto,
  UpdateTaskDto,
  VerifyTaskDto,
} from './dto/admin.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from './admin.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
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
}
