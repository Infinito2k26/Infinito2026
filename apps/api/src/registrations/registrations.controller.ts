import {
  BadRequestException,
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegistrationsService } from './registrations.service';
import { CreateRegistrationDto } from './dto/create-registration.dto';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

// Only INDIVIDUAL registrations carry files (photo + two ID documents —
// TEAM registrations already collected these for the captain via POST
// /teams). multer/FileFieldsInterceptor no-ops on a plain JSON request, so
// this is safe to apply unconditionally to a route that serves both shapes.
const IDENTITY_FILE_FIELDS = FileFieldsInterceptor(
  [
    { name: 'photo', maxCount: 1 },
    { name: 'idFile', maxCount: 1 },
    { name: 'secondaryIdFile', maxCount: 1 },
  ],
  { limits: { fileSize: 5 * 1024 * 1024 } },
);

const ALLOWED_IDENTITY_FILE_TYPES = /^(image\/jpeg|image\/png|image\/webp)$/;

type IdentityFiles = {
  photo?: Express.Multer.File[];
  idFile?: Express.Multer.File[];
  secondaryIdFile?: Express.Multer.File[];
};

function extractIdentityFiles(files: IdentityFiles) {
  const photo = files.photo?.[0];
  const idFile = files.idFile?.[0];
  const secondaryIdFile = files.secondaryIdFile?.[0];
  for (const file of [photo, idFile, secondaryIdFile]) {
    if (file && !ALLOWED_IDENTITY_FILE_TYPES.test(file.mimetype)) {
      throw new BadRequestException(
        'Identity files must be a JPEG, PNG, or WEBP image',
      );
    }
  }
  return { photo, idFile, secondaryIdFile };
}

@Controller('registrations')
export class RegistrationsController {
  constructor(private readonly registrationsService: RegistrationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(IDENTITY_FILE_FIELDS)
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateRegistrationDto,
    @UploadedFiles() uploaded: IdentityFiles,
  ) {
    const { photo, idFile, secondaryIdFile } = extractIdentityFiles(
      uploaded ?? {},
    );
    return await this.registrationsService.create(
      req.user.id,
      body,
      photo,
      idFile,
      secondaryIdFile,
    );
  }
}
