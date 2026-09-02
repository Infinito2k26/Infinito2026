import {
  Body,
  Controller,
  HttpStatus,
  Patch,
  ParseFilePipeBuilder,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from '@prisma/client';
import { SettingsService } from './settings.service';
import {
  UpdatePaymentSettingsDto,
  UpdateFestDatesDto,
} from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const IMAGE_FILE_OPTIONS = { limits: { fileSize: 5 * 1024 * 1024 } };

const optionalImageFilePipe = () =>
  new ParseFilePipeBuilder()
    .addFileTypeValidator({
      fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
    })
    .build({
      fileIsRequired: false,
      errorHttpStatusCode: HttpStatus.BAD_REQUEST,
    });

@Controller('admin/settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminSettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Patch('payment')
  @RequirePermission(AdminService.SETTINGS, 'write')
  @UseInterceptors(FileInterceptor('qrImage', IMAGE_FILE_OPTIONS))
  async updatePayment(
    @Body() dto: UpdatePaymentSettingsDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFile(optionalImageFilePipe()) qrImage?: Express.Multer.File,
  ) {
    return this.settingsService.updatePaymentSettings(
      dto,
      qrImage,
      req.user.id,
    );
  }

  @Patch('fest-dates')
  @RequirePermission(AdminService.SETTINGS, 'write')
  async updateFestDates(
    @Body() dto: UpdateFestDatesDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.settingsService.updateFestDates(dto, req.user.id);
  }
}
