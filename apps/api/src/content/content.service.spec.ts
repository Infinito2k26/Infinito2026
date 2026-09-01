import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';

import { ContentService } from './content.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

describe('ContentService', () => {
  let service: ContentService;

  let prisma: {
    teamMember: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
    galleryItem: {
      findMany: jest.Mock;
      findUnique: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
      count: jest.Mock;
    };
    brand: {
      findMany: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let uploadsService: { uploadProof: jest.Mock; getSignedGetUrl: jest.Mock };

  beforeEach(async () => {
    prisma = {
      teamMember: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      galleryItem: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      brand: {
        findMany: jest.fn(),
      },
      $transaction: jest.fn((ops: unknown[]) => Promise.all(ops)),
    };

    uploadsService = {
      uploadProof: jest.fn().mockResolvedValue({ key: 'team-photo/abc.jpg' }),
      getSignedGetUrl: jest.fn(
        (key: string) => `https://signed.example/${key}`,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        ContentService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploadsService },
      ],
    }).compile();

    service = moduleRef.get<ContentService>(ContentService);
  });

  describe('listTeamMembers', () => {
    it('groups members by department and signs photo URLs', async () => {
      prisma.teamMember.findMany.mockResolvedValue([
        {
          id: '1',
          name: 'A',
          department: 'Web',
          role: null,
          photoUrl: 'team-photo/a.jpg',
          displayOrder: 0,
        },
        {
          id: '2',
          name: 'B',
          department: 'Web',
          role: null,
          photoUrl: null,
          displayOrder: 1,
        },
        {
          id: '3',
          name: 'C',
          department: 'Media',
          role: null,
          photoUrl: null,
          displayOrder: 0,
        },
      ]);

      const result = await service.listTeamMembers();

      expect(result.departments).toEqual([
        {
          department: 'Web',
          members: [
            expect.objectContaining({
              id: '1',
              photoUrl: 'https://signed.example/team-photo/a.jpg',
            }),
            expect.objectContaining({ id: '2', photoUrl: null }),
          ],
        },
        {
          department: 'Media',
          members: [expect.objectContaining({ id: '3', photoUrl: null })],
        },
      ]);
    });
  });

  describe('createTeamMember', () => {
    it('uploads the photo and creates the member when a file is given', async () => {
      const photo = {
        buffer: Buffer.from('x'),
        mimetype: 'image/png',
      } as Express.Multer.File;
      prisma.teamMember.create.mockResolvedValue({
        id: '1',
        name: 'A',
        department: 'Web',
        role: null,
        photoUrl: 'team-photo/abc.jpg',
        displayOrder: 0,
      });

      const result = await service.createTeamMember(
        { name: 'A', department: 'Web' },
        photo,
      );

      expect(uploadsService.uploadProof).toHaveBeenCalledWith(
        photo.buffer,
        photo.mimetype,
        'team-photo',
      );
      expect(prisma.teamMember.create).toHaveBeenCalledWith({
        data: { name: 'A', department: 'Web', photoUrl: 'team-photo/abc.jpg' },
      });
      expect(result.photoUrl).toBe('https://signed.example/team-photo/abc.jpg');
    });

    it('creates the member with no photo when none is given', async () => {
      prisma.teamMember.create.mockResolvedValue({
        id: '1',
        name: 'A',
        department: 'Web',
        role: null,
        photoUrl: null,
        displayOrder: 0,
      });

      await service.createTeamMember({ name: 'A', department: 'Web' });

      expect(uploadsService.uploadProof).not.toHaveBeenCalled();
      expect(prisma.teamMember.create).toHaveBeenCalledWith({
        data: { name: 'A', department: 'Web', photoUrl: null },
      });
    });
  });

  describe('updateTeamMember', () => {
    it('throws when the member does not exist', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(
        service.updateTeamMember('missing', { name: 'A' }),
      ).rejects.toThrow(NotFoundException);
      expect(prisma.teamMember.update).not.toHaveBeenCalled();
    });

    it('preserves the existing photo when no new file is given', async () => {
      prisma.teamMember.findUnique.mockResolvedValue({
        id: '1',
        photoUrl: 'old.jpg',
      });
      prisma.teamMember.update.mockResolvedValue({
        id: '1',
        name: 'A2',
        department: 'Web',
        role: null,
        photoUrl: 'old.jpg',
        displayOrder: 0,
      });

      await service.updateTeamMember('1', { name: 'A2' });

      expect(prisma.teamMember.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'A2' },
      });
    });
  });

  describe('deleteTeamMember', () => {
    it('throws when the member does not exist', async () => {
      prisma.teamMember.findUnique.mockResolvedValue(null);

      await expect(service.deleteTeamMember('missing')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.teamMember.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing member', async () => {
      prisma.teamMember.findUnique.mockResolvedValue({ id: '1' });
      prisma.teamMember.delete.mockResolvedValue({ id: '1' });

      const result = await service.deleteTeamMember('1');

      expect(prisma.teamMember.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
      expect(result).toEqual({ id: '1' });
    });
  });

  describe('listGalleryItems', () => {
    it('paginates and signs image URLs', async () => {
      prisma.galleryItem.findMany.mockResolvedValue([
        {
          id: '1',
          imageUrl: 'gallery/a.jpg',
          caption: null,
          publishedAt: new Date(),
          createdAt: new Date(),
        },
      ]);
      prisma.galleryItem.count.mockResolvedValue(1);

      const result = await service.listGalleryItems(1, 20);

      expect(result.items[0].imageUrl).toBe(
        'https://signed.example/gallery/a.jpg',
      );
      expect(result.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
    });
  });

  describe('createGalleryItem', () => {
    it('uploads the image and creates the item', async () => {
      const image = {
        buffer: Buffer.from('x'),
        mimetype: 'image/jpeg',
      } as Express.Multer.File;
      uploadsService.uploadProof.mockResolvedValue({ key: 'gallery/new.jpg' });
      prisma.galleryItem.create.mockResolvedValue({
        id: '1',
        imageUrl: 'gallery/new.jpg',
        caption: 'A day at the fest',
        publishedAt: new Date(),
        createdAt: new Date(),
      });

      const result = await service.createGalleryItem(
        { caption: 'A day at the fest' },
        image,
      );

      expect(uploadsService.uploadProof).toHaveBeenCalledWith(
        image.buffer,
        image.mimetype,
        'gallery',
      );
      expect(result.imageUrl).toBe('https://signed.example/gallery/new.jpg');
    });
  });

  describe('deleteGalleryItem', () => {
    it('throws when the item does not exist', async () => {
      prisma.galleryItem.findUnique.mockResolvedValue(null);

      await expect(service.deleteGalleryItem('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('listPublicSponsors', () => {
    it('only queries publicly-listed, tiered, active brands', async () => {
      prisma.brand.findMany.mockResolvedValue([
        { id: '1', name: 'Acme', logoUrl: null, tier: 'GOLD' },
      ]);

      const result = await service.listPublicSponsors();

      expect(prisma.brand.findMany).toHaveBeenCalledWith({
        where: {
          tier: { not: null },
          isPubliclyListed: true,
          status: 'ACTIVE',
        },
        orderBy: { tier: 'asc' },
        select: { id: true, name: true, logoUrl: true, tier: true },
      });
      expect(result.sponsors).toHaveLength(1);
    });
  });
});
