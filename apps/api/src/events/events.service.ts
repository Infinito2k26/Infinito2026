import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto, UpdateEventDto } from './dto/events.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * limit;

    const where = { isPublished: true, deletedAt: null };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: 'asc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async create(dto: CreateEventDto) {
    return this.prisma.event.create({
      data: dto as unknown as Prisma.EventCreateInput,
    });
  }

  async update(id: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    // Admin-side safety guard only: blocks shrinking capacity below the
    // current roster. Full at-registration-time enforcement belongs to the
    // Registration module.
    const isLoweringCapacity =
      dto.capacity !== undefined &&
      event.capacity !== null &&
      dto.capacity < event.capacity;

    if (isLoweringCapacity) {
      const registeredCount = await this.prisma.registration.count({
        where: { eventId: id, status: { not: 'CANCELLED' } },
      });
      if (dto.capacity! < registeredCount) {
        throw new BadRequestException(
          `Cannot set capacity to ${dto.capacity}: ${registeredCount} non-cancelled registrations already exist`,
        );
      }
    }

    return this.prisma.event.update({
      where: { id },
      data: dto as unknown as Prisma.EventUpdateInput,
    });
  }

  async setPublished(id: string, isPublished: boolean) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.event.update({ where: { id }, data: { isPublished } });
  }
}
