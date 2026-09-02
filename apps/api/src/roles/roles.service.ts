import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto, UpdateRoleDto } from './dto/roles.dto';

@Injectable()
export class RolesService {
  constructor(private readonly prisma: PrismaService) {}

  async listRoles() {
    return this.prisma.customRole.findMany({
      where: { deletedAt: null },
      include: { permissions: true, _count: { select: { users: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async getRole(id: string) {
    const role = await this.prisma.customRole.findFirst({
      where: { id, deletedAt: null },
      include: { permissions: true, _count: { select: { users: true } } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async createRole(dto: CreateRoleDto) {
    try {
      return await this.prisma.customRole.create({
        data: {
          name: dto.name,
          description: dto.description,
          permissions: { create: dto.permissions },
        },
        include: { permissions: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A role with this name already exists');
      }
      throw error;
    }
  }

  async updateRole(id: string, dto: UpdateRoleDto) {
    await this.getRole(id);

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.permissions) {
          await tx.rolePermission.deleteMany({ where: { roleId: id } });
        }

        return tx.customRole.update({
          where: { id },
          data: {
            name: dto.name,
            description: dto.description,
            ...(dto.permissions
              ? { permissions: { create: dto.permissions } }
              : {}),
          },
          include: { permissions: true },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('A role with this name already exists');
      }
      throw error;
    }
  }

  async deleteRole(id: string) {
    const role = await this.prisma.customRole.findFirst({
      where: { id, deletedAt: null },
      include: { _count: { select: { users: true } } },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    if (role._count.users > 0) {
      throw new ConflictException(
        'Cannot delete a role that is still assigned to users. Unassign it from all users first.',
      );
    }

    return this.prisma.customRole.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
