import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';

import { EventsService } from './events.service';
import { PrismaService } from '../prisma/prisma.service';

describe('EventsService', () => {
  let service: EventsService;

  let prisma: {
    event: {
      findUnique: jest.Mock;
      findFirst: jest.Mock;
      update: jest.Mock;
    };
    registration: {
      count: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      event: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      registration: {
        count: jest.fn(),
      },
    };

    const moduleRef = await Test.createTestingModule({
      providers: [EventsService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = moduleRef.get<EventsService>(EventsService);
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
  });
});
