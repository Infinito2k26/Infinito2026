import {
  Body,
  Controller,
  Delete,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SkipThrottle } from '@nestjs/throttler';
import { AdminService } from '@prisma/client';
import { ContentService } from './content.service';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

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

@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('team')
  @RequirePermission(AdminService.CONTENT, 'write')
  @UseInterceptors(FileInterceptor('photo', IMAGE_FILE_OPTIONS))
  async createTeamMember(
    @Body() dto: CreateTeamMemberDto,
    @UploadedFile(optionalImageFilePipe()) photo?: Express.Multer.File,
  ) {
    return this.contentService.createTeamMember(dto, photo);
  }

  @Patch('team/:id')
  @RequirePermission(AdminService.CONTENT, 'write')
  @UseInterceptors(FileInterceptor('photo', IMAGE_FILE_OPTIONS))
  async updateTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamMemberDto,
    @UploadedFile(optionalImageFilePipe()) photo?: Express.Multer.File,
  ) {
    return this.contentService.updateTeamMember(id, dto, photo);
  }

  @Delete('team/:id')
  @RequirePermission(AdminService.CONTENT, 'delete')
  async deleteTeamMember(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.deleteTeamMember(id);
  }

  @Post('gallery')
  @RequirePermission(AdminService.GALLERY, 'write')
  @UseInterceptors(FileInterceptor('image', IMAGE_FILE_OPTIONS))
  async createGalleryItem(
    @Body() dto: CreateGalleryItemDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    image: Express.Multer.File,
  ) {
    return this.contentService.createGalleryItem(dto, image);
  }

  @Patch('gallery/:id')
  @RequirePermission(AdminService.GALLERY, 'write')
  async updateGalleryItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryItemDto,
  ) {
    return this.contentService.updateGalleryItem(id, dto);
  }

  @Delete('gallery/:id')
  @RequirePermission(AdminService.GALLERY, 'delete')
  async deleteGalleryItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.deleteGalleryItem(id);
  }
}
