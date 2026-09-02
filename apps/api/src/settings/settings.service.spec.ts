import { Test } from '@nestjs/testing';

import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';

describe('SettingsService', () => {
  let service: SettingsService;

  let prisma: {
    siteSettings: {
      findUnique: jest.Mock<Promise<unknown>, [unknown]>;
      upsert: jest.Mock<Promise<unknown>, [unknown]>;
    };
  };
  let uploadsService: { uploadProof: jest.Mock; getSignedGetUrl: jest.Mock };

  beforeEach(async () => {
    prisma = {
      siteSettings: {
        findUnique: jest.fn<Promise<unknown>, [unknown]>(),
        upsert: jest.fn<Promise<unknown>, [unknown]>(),
      },
    };

    uploadsService = {
      uploadProof: jest.fn().mockResolvedValue({ key: 'site-settings/qr.png' }),
      getSignedGetUrl: jest.fn(
        (key: string) => `https://signed.example/${key}`,
      ),
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: UploadsService, useValue: uploadsService },
      ],
    }).compile();

    service = moduleRef.get<SettingsService>(SettingsService);
  });

  describe('getPublicSettings', () => {
    it('returns all nulls before any admin edit', async () => {
      prisma.siteSettings.findUnique.mockResolvedValue(null);

      const result = await service.getPublicSettings();

      expect(result).toEqual({
        upiVpa: null,
        upiPayeeName: null,
        paymentQrImageUrl: null,
        festStartAt: null,
        festEndAt: null,
        registrationCloseAt: null,
        dateRangeLabel: null,
      });
      expect(uploadsService.getSignedGetUrl).not.toHaveBeenCalled();
    });

    it('signs the QR image URL once set', async () => {
      prisma.siteSettings.findUnique.mockResolvedValue({
        upiVpa: 'infinito@upi',
        upiPayeeName: 'Infinito 2K26',
        paymentQrImageUrl: 'site-settings/qr.png',
        festStartAt: null,
        festEndAt: null,
        registrationCloseAt: null,
        dateRangeLabel: null,
      });

      const result = await service.getPublicSettings();

      expect(result.paymentQrImageUrl).toBe(
        'https://signed.example/site-settings/qr.png',
      );
    });
  });

  describe('updatePaymentSettings', () => {
    it('uploads the QR image and upserts the singleton row', async () => {
      const qrImage = {
        buffer: Buffer.from('x'),
        mimetype: 'image/png',
      } as Express.Multer.File;

      await service.updatePaymentSettings(
        { upiVpa: 'infinito@upi', upiPayeeName: 'Infinito 2K26' },
        qrImage,
        'admin-1',
      );

      expect(uploadsService.uploadProof).toHaveBeenCalledWith(
        qrImage.buffer,
        qrImage.mimetype,
        'site-settings',
      );
      expect(prisma.siteSettings.upsert).toHaveBeenCalledWith({
        where: { id: 'singleton' },
        create: {
          id: 'singleton',
          upiVpa: 'infinito@upi',
          upiPayeeName: 'Infinito 2K26',
          paymentQrImageUrl: 'site-settings/qr.png',
          updatedByUserId: 'admin-1',
        },
        update: {
          upiVpa: 'infinito@upi',
          upiPayeeName: 'Infinito 2K26',
          paymentQrImageUrl: 'site-settings/qr.png',
          updatedByUserId: 'admin-1',
        },
      });
    });

    it('preserves the existing QR image when no new file is given', async () => {
      await service.updatePaymentSettings(
        { upiVpa: 'infinito@upi' },
        undefined,
        'admin-1',
      );

      expect(uploadsService.uploadProof).not.toHaveBeenCalled();
      const call = prisma.siteSettings.upsert.mock.calls[0][0] as {
        update: Record<string, unknown>;
      };
      expect(call.update).not.toHaveProperty('paymentQrImageUrl');
    });
  });

  describe('updateFestDates', () => {
    it('converts ISO date strings before writing', async () => {
      await service.updateFestDates(
        {
          festStartAt: '2026-10-09T09:00:00+05:30',
          dateRangeLabel: '9-11 October 2026',
        },
        'admin-1',
      );

      const call = prisma.siteSettings.upsert.mock.calls[0][0] as {
        update: { festStartAt: Date; dateRangeLabel: string };
      };
      expect(call.update.festStartAt).toEqual(
        new Date('2026-10-09T09:00:00+05:30'),
      );
      expect(call.update.dateRangeLabel).toBe('9-11 October 2026');
    });
  });
});
