import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { TaskStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

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

  async getTaskAssignments(
    taskId: string,
    page = 1,
    limit = 20,
    status?: string,
  ) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);

    const skip = (page - 1) * limit;

    const task = await this.prisma.caTask.findUnique({
      where: { id: taskId },
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        source: true,
        points: true,
        deadline: true,
        status: true,
      },
    });

    if (!task) {
      throw new BadRequestException('CA task not found');
    }

    const allowedStatuses = ['PENDING', 'SUBMITTED', 'VERIFIED', 'REJECTED'];

    if (status && !allowedStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid assignment status. Allowed values: ${allowedStatuses.join(', ')}`,
      );
    }

    const where = {
      taskId,
      ...(status ? { status: status as TaskStatus } : {}),
    };

    const [assignments, total] = await this.prisma.$transaction([
      this.prisma.cATaskAssignment.findMany({
        where,
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          status: true,
          proofUrl: true,
          proofNote: true,
          rejectionReason: true,
          pointsAwarded: true,
          submittedAt: true,
          verifiedAt: true,
          createdAt: true,
          updatedAt: true,

          caProfile: {
            select: {
              id: true,
              assignedCollegeName: true,
              user: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },

          task: {
            select: {
              id: true,
              title: true,
              description: true,
              category: true,
              source: true,
              points: true,
              deadline: true,
            },
          },
        },
      }),

      this.prisma.cATaskAssignment.count({
        where,
      }),
    ]);

    const assignmentsWithSignedProofs = await Promise.all(
      assignments.map(async (assignment) => {
        let proofUrl = assignment.proofUrl;

        if (proofUrl?.startsWith('ca-proof/')) {
          proofUrl = await this.uploadsService.getSignedGetUrl(proofUrl, 900);
        }

        return {
          ...assignment,
          proofUrl,
        };
      }),
    );

    return {
      task,
      assignments: assignmentsWithSignedProofs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
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
        status: 'SUBMITTED',
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
