import { Test } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

function uniqueConstraintError(target: string[]) {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
    meta: { target },
  });
}

describe('EventsService', () => {
  let service: EventsService;

  let prisma: {
    event: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
    registration: {
      count: jest.Mock;
    };
    eventRulebook: {
      create: jest.Mock;
      findMany: jest.Mock;
      findUnique: jest.Mock;
      delete: jest.Mock;
    };
  };
  let uploadsService: { getSignedGetUrl: jest.Mock };

  beforeEach(async () => {
    prisma = {
      event: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      registration: {
        count: jest.fn(),
      },
      eventRulebook: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        delete: jest.fn(),
      },
    };

    uploadsService = {
      getSignedGetUrl: jest.fn(
        (key: string) => `https://signed.example/${key}`,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        EventsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploadsService },
      ],
    }).compile();

    service = moduleRef.get<EventsService>(EventsService);
  });

  describe('findById', () => {
    it('throws NotFoundException when the event does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.findById('evt-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException for a soft-deleted event', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: new Date(),
      });

      await expect(service.findById('evt-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns an unpublished draft event (unlike findBySlug)', async () => {
      const event = { id: 'evt-1', isPublished: false, deletedAt: null };
      prisma.event.findUnique.mockResolvedValue(event);

      await expect(service.findById('evt-1')).resolves.toEqual(event);
    });
  });

  describe('findBySlug', () => {
    it('throws NotFoundException when no published event matches the slug', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.findBySlug('nope')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns the event including its active sub-options', async () => {
      const event = {
        id: 'evt-1',
        slug: 'athletics-2k26',
        subOptions: [{ id: 'sub-1', name: '100m', isActive: true }],
      };
      prisma.event.findFirst.mockResolvedValue(event);

      await expect(service.findBySlug('athletics-2k26')).resolves.toEqual(
        event,
      );
      expect(prisma.event.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          include: { subOptions: { where: { isActive: true } } },
        }),
      );
    });
  });

  describe('create', () => {
    const dto = { name: 'Chess', slug: 'chess-2k26' };

    it('creates the event', async () => {
      prisma.event.create.mockResolvedValue({ id: 'evt-1', ...dto });

      await expect(service.create(dto as never)).resolves.toEqual({
        id: 'evt-1',
        ...dto,
      });
    });

    it('rejects a duplicate slug with a clear ConflictException instead of a raw 500', async () => {
      prisma.event.create.mockRejectedValue(uniqueConstraintError(['slug']));

      await expect(service.create(dto as never)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    it('throws NotFoundException when the event does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(service.update('evt-1', { capacity: 10 })).rejects.toThrow(
        NotFoundException,
      );
    });

    it('rejects lowering capacity below the current non-cancelled registration count', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        capacity: 100,
      });
      prisma.registration.count.mockResolvedValue(50);

      await expect(service.update('evt-1', { capacity: 40 })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.event.update).not.toHaveBeenCalled();
    });

    it('allows lowering capacity down to the current registration count', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        capacity: 100,
      });
      prisma.registration.count.mockResolvedValue(50);
      prisma.event.update.mockResolvedValue({ id: 'evt-1', capacity: 50 });

      await expect(service.update('evt-1', { capacity: 50 })).resolves.toEqual({
        id: 'evt-1',
        capacity: 50,
      });
    });

    it('does not guard when capacity is unset on the event', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        capacity: null,
      });
      prisma.event.update.mockResolvedValue({ id: 'evt-1', capacity: 10 });

      await expect(service.update('evt-1', { capacity: 10 })).resolves.toEqual({
        id: 'evt-1',
        capacity: 10,
      });
      expect(prisma.registration.count).not.toHaveBeenCalled();
    });

    it('does not guard when capacity is being raised', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        capacity: 50,
      });
      prisma.event.update.mockResolvedValue({ id: 'evt-1', capacity: 100 });

      await expect(service.update('evt-1', { capacity: 100 })).resolves.toEqual(
        { id: 'evt-1', capacity: 100 },
      );
      expect(prisma.registration.count).not.toHaveBeenCalled();
    });

    it('rejects a duplicate slug with a clear ConflictException instead of a raw 500', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
        capacity: null,
      });
      prisma.event.update.mockRejectedValue(uniqueConstraintError(['slug']));

      await expect(
        service.update('evt-1', { slug: 'taken-slug' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('addRulebook', () => {
    it('throws NotFoundException when the event does not exist', async () => {
      prisma.event.findUnique.mockResolvedValue(null);

      await expect(
        service.addRulebook(
          'evt-1',
          { title: 'Rules' },
          'admin-1',
          'rulebooks/a.pdf',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException when neither fileUrl nor a file is given', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
      });

      await expect(
        service.addRulebook('evt-1', { title: 'Rules' }, 'admin-1'),
      ).rejects.toThrow(BadRequestException);
      expect(prisma.eventRulebook.create).not.toHaveBeenCalled();
    });

    it('rejects a malformed fileUrl', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
      });

      await expect(
        service.addRulebook(
          'evt-1',
          { title: 'Rules', fileUrl: 'not a url' },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects a non-http(s) fileUrl scheme', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
      });

      await expect(
        service.addRulebook(
          'evt-1',
          { title: 'Rules', fileUrl: 'ftp://example.com/rules.pdf' },
          'admin-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('creates a rulebook from a pasted https fileUrl', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
      });
      prisma.eventRulebook.create.mockResolvedValue({
        id: 'rb-1',
        eventId: 'evt-1',
        title: 'Rules',
        version: null,
        fileUrl: 'https://drive.google.com/rules.pdf',
        uploadedById: 'admin-1',
        createdAt: new Date(),
      });

      const result = await service.addRulebook(
        'evt-1',
        { title: 'Rules', fileUrl: 'https://drive.google.com/rules.pdf' },
        'admin-1',
      );

      expect(uploadsService.getSignedGetUrl).not.toHaveBeenCalled();
      expect(result.fileUrl).toBe('https://drive.google.com/rules.pdf');
    });

    it('creates a rulebook from an uploaded file key and signs it on return', async () => {
      prisma.event.findUnique.mockResolvedValue({
        id: 'evt-1',
        deletedAt: null,
      });
      prisma.eventRulebook.create.mockResolvedValue({
        id: 'rb-1',
        eventId: 'evt-1',
        title: 'Rules',
        version: null,
        fileUrl: 'rulebooks/abc.pdf',
        uploadedById: 'admin-1',
        createdAt: new Date(),
      });

      const result = await service.addRulebook(
        'evt-1',
        { title: 'Rules' },
        'admin-1',
        'rulebooks/abc.pdf',
      );

      expect(result.fileUrl).toBe('https://signed.example/rulebooks/abc.pdf');
    });
  });

  describe('listRulebooksBySlug', () => {
    it('throws NotFoundException for an unpublished/unknown event slug', async () => {
      prisma.event.findFirst.mockResolvedValue(null);

      await expect(service.listRulebooksBySlug('nope')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.eventRulebook.findMany).not.toHaveBeenCalled();
    });

    it('signs uploaded file keys but leaves external URLs untouched', async () => {
      prisma.event.findFirst.mockResolvedValue({ id: 'evt-1', slug: 'chess' });
      prisma.eventRulebook.findMany.mockResolvedValue([
        { id: 'rb-1', fileUrl: 'rulebooks/abc.pdf' },
        { id: 'rb-2', fileUrl: 'https://drive.google.com/rules.pdf' },
      ]);

      const result = await service.listRulebooksBySlug('chess');

      expect(result.rulebooks[0].fileUrl).toBe(
        'https://signed.example/rulebooks/abc.pdf',
      );
      expect(result.rulebooks[1].fileUrl).toBe(
        'https://drive.google.com/rules.pdf',
      );
    });
  });

  describe('deleteRulebook', () => {
    it('throws NotFoundException when the rulebook does not exist', async () => {
      prisma.eventRulebook.findUnique.mockResolvedValue(null);

      await expect(service.deleteRulebook('rb-1')).rejects.toThrow(
        NotFoundException,
      );
      expect(prisma.eventRulebook.delete).not.toHaveBeenCalled();
    });

    it('deletes an existing rulebook', async () => {
      prisma.eventRulebook.findUnique.mockResolvedValue({ id: 'rb-1' });
      prisma.eventRulebook.delete.mockResolvedValue({ id: 'rb-1' });

      const result = await service.deleteRulebook('rb-1');

      expect(prisma.eventRulebook.delete).toHaveBeenCalledWith({
        where: { id: 'rb-1' },
      });
      expect(result).toEqual({ id: 'rb-1' });
    });
  });
});
