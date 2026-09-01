import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/content.dto';

@Injectable()
export class ContentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  private withSignedPhoto<T extends { photoUrl: string | null }>(
    member: T,
  ): T & { photoUrl: string | null } {
    return {
      ...member,
      photoUrl: member.photoUrl
        ? this.uploadsService.getSignedGetUrl(member.photoUrl)
        : null,
    };
  }

  async listTeamMembers() {
    const members = await this.prisma.teamMember.findMany({
      orderBy: [{ department: 'asc' }, { displayOrder: 'asc' }],
    });

    const grouped = new Map<
      string,
      ReturnType<typeof this.withSignedPhoto>[]
    >();
    for (const member of members) {
      const signed = this.withSignedPhoto(member);
      const bucket = grouped.get(member.department) ?? [];
      bucket.push(signed);
      grouped.set(member.department, bucket);
    }

    return {
      departments: Array.from(grouped.entries()).map(
        ([department, members]) => ({
          department,
          members,
        }),
      ),
    };
  }

  async createTeamMember(
    dto: CreateTeamMemberDto,
    photo?: Express.Multer.File,
  ) {
    const photoUrl = photo
      ? (
          await this.uploadsService.uploadProof(
            photo.buffer,
            photo.mimetype,
            'team-photo',
          )
        ).key
      : null;

    const member = await this.prisma.teamMember.create({
      data: { ...dto, photoUrl },
    });
    return this.withSignedPhoto(member);
  }

  async updateTeamMember(
    id: string,
    dto: UpdateTeamMemberDto,
    photo?: Express.Multer.File,
  ) {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Team member not found');
    }

    const photoUrl = photo
      ? (
          await this.uploadsService.uploadProof(
            photo.buffer,
            photo.mimetype,
            'team-photo',
          )
        ).key
      : undefined;

    const member = await this.prisma.teamMember.update({
      where: { id },
      data: { ...dto, ...(photoUrl !== undefined ? { photoUrl } : {}) },
    });
    return this.withSignedPhoto(member);
  }

  async deleteTeamMember(id: string) {
    const existing = await this.prisma.teamMember.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('Team member not found');
    }
    await this.prisma.teamMember.delete({ where: { id } });
    return { id };
  }

  async listGalleryItems(page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * limit;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.galleryItem.findMany({
        skip,
        take: limit,
        orderBy: { publishedAt: 'desc' },
      }),
      this.prisma.galleryItem.count(),
    ]);

    return {
      items: items.map((item) => ({
        ...item,
        imageUrl: this.uploadsService.getSignedGetUrl(item.imageUrl),
      })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createGalleryItem(
    dto: CreateGalleryItemDto,
    image: Express.Multer.File,
  ) {
    const { key } = await this.uploadsService.uploadProof(
      image.buffer,
      image.mimetype,
      'gallery',
    );

    const item = await this.prisma.galleryItem.create({
      data: { caption: dto.caption, imageUrl: key },
    });
    return {
      ...item,
      imageUrl: this.uploadsService.getSignedGetUrl(item.imageUrl),
    };
  }

  async updateGalleryItem(id: string, dto: UpdateGalleryItemDto) {
    const existing = await this.prisma.galleryItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Gallery item not found');
    }

    const item = await this.prisma.galleryItem.update({
      where: { id },
      data: { caption: dto.caption },
    });
    return {
      ...item,
      imageUrl: this.uploadsService.getSignedGetUrl(item.imageUrl),
    };
  }

  async deleteGalleryItem(id: string) {
    const existing = await this.prisma.galleryItem.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new NotFoundException('Gallery item not found');
    }
    await this.prisma.galleryItem.delete({ where: { id } });
    return { id };
  }

  async listPublicSponsors() {
    const sponsors = await this.prisma.brand.findMany({
      where: { tier: { not: null }, isPubliclyListed: true, status: 'ACTIVE' },
      orderBy: { tier: 'asc' },
      select: { id: true, name: true, logoUrl: true, tier: true },
    });

    return { sponsors };
  }
}
