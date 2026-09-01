import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { EventsService, RULEBOOK_UPLOAD_FOLDER } from './events.service';
import { CreateRulebookDto } from './dto/rulebooks.dto';
import { UploadsService } from '../uploads/uploads.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@SkipThrottle()
export class AdminRulebooksController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Get('admin/events/:eventId/rulebooks')
  async list(@Param('eventId', ParseUUIDPipe) eventId: string) {
    return this.eventsService.listRulebooksByEventId(eventId);
  }

  @Post('admin/events/:eventId/rulebooks')
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  async create(
    @Req() req: AuthenticatedRequest,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: CreateRulebookDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({ fileType: /^application\/pdf$/ })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file?: Express.Multer.File,
  ) {
    let fileKey: string | undefined;
    if (file) {
      const uploaded = await this.uploadsService.uploadProof(
        file.buffer,
        file.mimetype,
        RULEBOOK_UPLOAD_FOLDER,
      );
      fileKey = uploaded.key;
    }

    return this.eventsService.addRulebook(eventId, dto, req.user.id, fileKey);
  }

  @Delete('admin/rulebooks/:id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.deleteRulebook(id);
  }
}
