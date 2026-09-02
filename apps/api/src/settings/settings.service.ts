import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import {
  UpdatePaymentSettingsDto,
  UpdateFestDatesDto,
} from './dto/settings.dto';

const SINGLETON_ID = 'singleton';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async getPublicSettings() {
    const settings = await this.prisma.siteSettings.findUnique({
      where: { id: SINGLETON_ID },
    });

    return {
      upiVpa: settings?.upiVpa ?? null,
      upiPayeeName: settings?.upiPayeeName ?? null,
      paymentQrImageUrl: settings?.paymentQrImageUrl
        ? this.uploadsService.getSignedGetUrl(settings.paymentQrImageUrl)
        : null,
      festStartAt: settings?.festStartAt ?? null,
      festEndAt: settings?.festEndAt ?? null,
      registrationCloseAt: settings?.registrationCloseAt ?? null,
      dateRangeLabel: settings?.dateRangeLabel ?? null,
    };
  }

  async updatePaymentSettings(
    dto: UpdatePaymentSettingsDto,
    qrImage: Express.Multer.File | undefined,
    adminId: string,
  ) {
    const paymentQrImageUrl = qrImage
      ? (
          await this.uploadsService.uploadProof(
            qrImage.buffer,
            qrImage.mimetype,
            'site-settings',
          )
        ).key
      : undefined;

    return this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      create: {
        id: SINGLETON_ID,
        ...dto,
        paymentQrImageUrl,
        updatedByUserId: adminId,
      },
      update: {
        ...dto,
        ...(paymentQrImageUrl !== undefined ? { paymentQrImageUrl } : {}),
        updatedByUserId: adminId,
      },
    });
  }

  async updateFestDates(dto: UpdateFestDatesDto, adminId: string) {
    const data = {
      ...dto,
      festStartAt: dto.festStartAt ? new Date(dto.festStartAt) : undefined,
      festEndAt: dto.festEndAt ? new Date(dto.festEndAt) : undefined,
      registrationCloseAt: dto.registrationCloseAt
        ? new Date(dto.registrationCloseAt)
        : undefined,
    };

    return await this.prisma.siteSettings.upsert({
      where: { id: SINGLETON_ID },
      create: { id: SINGLETON_ID, ...data, updatedByUserId: adminId },
      update: { ...data, updatedByUserId: adminId },
    });
  }
}
