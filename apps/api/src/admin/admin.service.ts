import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateBrandDto,
  UpdateBrandDto,
  CreateTaskDto,
  UpdateTaskDto,
  VerifyTaskDto,
  TaskSource as DtoTaskSource,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  // Brands CRUD
  async createBrand(dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: dto,
    });
  }

  async getBrands() {
    return this.prisma.brand.findMany({ where: { status: 'ACTIVE' } });
  }

  async updateBrand(id: string, dto: UpdateBrandDto) {
    return this.prisma.brand.update({
      where: { id },
      data: dto,
    });
  }

  // Tasks CRUD
  async createTask(dto: CreateTaskDto) {
    if (dto.source === DtoTaskSource.MODERATOR && dto.brandId) {
      throw new BadRequestException(
        'brandId must not be provided for MODERATOR sourced tasks',
      );
    }

    return this.prisma.caTask.create({
      data: {
        title: dto.title,
        description: dto.description,
        category: dto.category,
        source: dto.source,
        brandId: dto.brandId,
        points: dto.points,
      },
    });
  }

  async getTasks() {
    return this.prisma.caTask.findMany({ where: { status: 'ACTIVE' } });
  }

  async updateTask(id: string, dto: UpdateTaskDto) {
    return this.prisma.caTask.update({
      where: { id },
      data: dto,
    });
  }

  // Verification
  async verifyTask(assignmentId: string, dto: VerifyTaskDto, adminId: string) {
    // Compare-and-swap mechanism
    const result = await this.prisma.cATaskAssignment.updateMany({
      where: {
        id: assignmentId,
        status: 'PENDING',
      },
      data: {
        status: dto.status,
        pointsAwarded: dto.pointsOverride,
        verifiedById: adminId,
        verifiedAt: new Date(),
        rejectionReason: dto.rejectionReason,
      },
    });

    if (result.count === 0) {
      throw new ConflictException(
        'Task assignment could not be verified. It may not exist or is no longer PENDING.',
      );
    }

    return { success: true, count: result.count };
  }
}
