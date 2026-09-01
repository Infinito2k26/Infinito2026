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
import { UserRole } from '@prisma/client';
import { ContentService } from './content.service';
import {
  CreateTeamMemberDto,
  UpdateTeamMemberDto,
  CreateGalleryItemDto,
  UpdateGalleryItemDto,
} from './dto/content.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

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
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@SkipThrottle()
export class AdminContentController {
  constructor(private readonly contentService: ContentService) {}

  @Post('team')
  @UseInterceptors(FileInterceptor('photo', IMAGE_FILE_OPTIONS))
  async createTeamMember(
    @Body() dto: CreateTeamMemberDto,
    @UploadedFile(optionalImageFilePipe()) photo?: Express.Multer.File,
  ) {
    return this.contentService.createTeamMember(dto, photo);
  }

  @Patch('team/:id')
  @UseInterceptors(FileInterceptor('photo', IMAGE_FILE_OPTIONS))
  async updateTeamMember(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeamMemberDto,
    @UploadedFile(optionalImageFilePipe()) photo?: Express.Multer.File,
  ) {
    return this.contentService.updateTeamMember(id, dto, photo);
  }

  @Delete('team/:id')
  async deleteTeamMember(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.deleteTeamMember(id);
  }

  @Post('gallery')
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
  async updateGalleryItem(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGalleryItemDto,
  ) {
    return this.contentService.updateGalleryItem(id, dto);
  }

  @Delete('gallery/:id')
  async deleteGalleryItem(@Param('id', ParseUUIDPipe) id: string) {
    return this.contentService.deleteGalleryItem(id);
  }
}
