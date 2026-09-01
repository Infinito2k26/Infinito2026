import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Param,
  ParseUUIDPipe,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { TeamsService } from './teams.service';
import { CreateTeamDto, JoinTeamDto } from './dto/teams.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const ROSTER_FILE_FIELDS = FileFieldsInterceptor(
  [
    { name: 'photo', maxCount: 1 },
    { name: 'idFile', maxCount: 1 },
  ],
  { limits: { fileSize: 5 * 1024 * 1024 } },
);

const ALLOWED_ROSTER_FILE_TYPES = /^(image\/jpeg|image\/png|image\/webp)$/;

type RosterFiles = {
  photo?: Express.Multer.File[];
  idFile?: Express.Multer.File[];
};

// ponytail: NestJS's ParseFilePipeBuilder validators only understand a flat
// array or a single file — @UploadedFiles() from FileFieldsInterceptor
// returns {photo: [File], idFile: [File]}, an object, which the pipe's
// validateFilesOrFile() silently treats as ONE file with no .mimetype,
// so every upload failed type validation regardless of the real file type.
// Validating manually here instead of via a pipe sidesteps that entirely.
export function requireRosterFiles(files: RosterFiles) {
  const photo = files.photo?.[0];
  const idFile = files.idFile?.[0];
  if (!photo || !idFile) {
    throw new BadRequestException(
      'Both "photo" and "idFile" files are required',
    );
  }
  for (const [field, file] of [
    ['photo', photo],
    ['idFile', idFile],
  ] as const) {
    if (!ALLOWED_ROSTER_FILE_TYPES.test(file.mimetype)) {
      throw new BadRequestException(
        `"${field}" must be a JPEG, PNG, or WEBP image`,
      );
    }
  }
  return { photo, idFile };
}

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get('mine')
  async listMine(@Req() req: AuthenticatedRequest) {
    return this.teamsService.listMine(req.user.id);
  }

  @Post()
  @UseInterceptors(ROSTER_FILE_FIELDS)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateTeamDto,
    @UploadedFiles() uploaded: RosterFiles,
  ) {
    const { photo, idFile } = requireRosterFiles(uploaded);
    return this.teamsService.createTeam(req.user.id, body, photo, idFile);
  }

  @Post(':id/invitations')
  async rotateInvite(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.teamsService.rotateInviteCode(id, req.user.id);
  }

  @Post('join')
  @UseInterceptors(ROSTER_FILE_FIELDS)
  async join(
    @Req() req: AuthenticatedRequest,
    @Body() body: JoinTeamDto,
    @UploadedFiles() uploaded: RosterFiles,
  ) {
    const { photo, idFile } = requireRosterFiles(uploaded);
    return this.teamsService.join(body, req.user.id, photo, idFile);
  }
}
