import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Ip,
  HttpCode,
  HttpStatus,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipeBuilder,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { UploadsService } from '../uploads/uploads.service';
import { CaService } from './ca.service';

import {
  CaOnboardDto,
  ReferralClickDto,
  SubmitTaskDto,
  CreateApplicationDto,
} from './dto/ca.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

import { UserRole } from '@prisma/client';

import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('ca')
export class CaController {
  constructor(
    private readonly caService: CaService,
    private readonly uploadsService: UploadsService,
  ) {}

  @Post('onboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CAMPUS_AMBASSADOR)
  async onboard(@Req() req: AuthenticatedRequest, @Body() body: CaOnboardDto) {
    const userId = req.user.id;

    return await this.caService.onboard(userId, body.college);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.CAMPUS_AMBASSADOR)
  async getMe(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    return await this.caService.getMe(userId);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  async apply(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateApplicationDto,
  ) {
    const userId = req.user.id;

    return await this.caService.applyForCA(userId, body.targetCollege);
  }

  @Get('apply/me')
  @UseGuards(JwtAuthGuard)
  async getMyApplication(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    return await this.caService.getMyApplication(userId);
  }

  @Post('referral/click')
  @HttpCode(HttpStatus.OK)
  async referralClick(@Body() body: ReferralClickDto, @Ip() ip: string) {
    return await this.caService.recordClick(body.referralCode, ip || 'unknown');
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard)
  async getTasks(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    return await this.caService.getTasks(userId);
  }

  @Post('tasks/:taskId/submit')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
    }),
  )
  async submitTask(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() body: SubmitTaskDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
        })
        .build({
          fileIsRequired: false,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file?: Express.Multer.File,
  ) {
    const userId = req.user.id;

    let fileKey: string | undefined;

    if (file) {
      const uploaded = await this.uploadsService.uploadProof(
        file.buffer,
        file.mimetype,
      );

      fileKey = uploaded.key;
    }

    return await this.caService.submitTask(
      userId,
      taskId,
      body.proofUrl,
      fileKey,
      body.proofNote,
    );
  }
}
