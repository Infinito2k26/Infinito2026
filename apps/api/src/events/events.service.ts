import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateEventDto, UpdateEventDto } from './dto/events.dto';
import { CreateRulebookDto } from './dto/rulebooks.dto';

export const RULEBOOK_UPLOAD_FOLDER = 'rulebooks';

@Injectable()
export class EventsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

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

  async listAll(page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * limit;

    const where = { deletedAt: null };

    const [events, total] = await this.prisma.$transaction([
      this.prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.event.count({ where }),
    ]);

    return {
      events,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.prisma.event.findFirst({
      where: { slug, isPublished: true, deletedAt: null },
      include: { subOptions: { where: { isActive: true } } },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return event;
  }

  async create(dto: CreateEventDto) {
    try {
      return await this.prisma.event.create({
        data: dto as unknown as Prisma.EventCreateInput,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `An event with the slug "${dto.slug}" already exists — choose a different slug`,
        );
      }
      throw error;
    }
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

    try {
      return await this.prisma.event.update({
        where: { id },
        data: dto as unknown as Prisma.EventUpdateInput,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `An event with the slug "${dto.slug}" already exists — choose a different slug`,
        );
      }
      throw error;
    }
  }

  async setPublished(id: string, isPublished: boolean) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    return this.prisma.event.update({ where: { id }, data: { isPublished } });
  }

  private signRulebookUrl(fileUrl: string): string {
    return fileUrl.startsWith(`${RULEBOOK_UPLOAD_FOLDER}/`)
      ? this.uploadsService.getSignedGetUrl(fileUrl)
      : fileUrl;
  }

  async addRulebook(
    eventId: string,
    dto: CreateRulebookDto,
    adminId: string,
    fileKey?: string,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
    });
    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }

    if (dto.fileUrl) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(dto.fileUrl);
      } catch {
        throw new BadRequestException('Invalid file URL');
      }
      if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        throw new BadRequestException(
          'Invalid URL scheme. Only http and https are allowed.',
        );
      }
    }

    const finalFileUrl = dto.fileUrl || fileKey;
    if (!finalFileUrl) {
      throw new BadRequestException(
        'Either fileUrl or an uploaded file is required',
      );
    }

    const rulebook = await this.prisma.eventRulebook.create({
      data: {
        eventId,
        title: dto.title,
        version: dto.version,
        fileUrl: finalFileUrl,
        uploadedById: adminId,
      },
    });
    return { ...rulebook, fileUrl: this.signRulebookUrl(rulebook.fileUrl) };
  }

  async listRulebooksBySlug(slug: string) {
    const event = await this.findBySlug(slug);
    return this.listRulebooksByEventId(event.id);
  }

  // Admin variant — unlike listRulebooksBySlug, works for an unpublished
  // draft event too, so admins can manage rulebooks before publishing.
  async listRulebooksByEventId(eventId: string) {
    const rulebooks = await this.prisma.eventRulebook.findMany({
      where: { eventId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      rulebooks: rulebooks.map((rulebook) => ({
        ...rulebook,
        fileUrl: this.signRulebookUrl(rulebook.fileUrl),
      })),
    };
  }

  async deleteRulebook(id: string) {
    const existing = await this.prisma.eventRulebook.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Rulebook not found');
    }
    await this.prisma.eventRulebook.delete({ where: { id } });
    return { id };
  }
}
