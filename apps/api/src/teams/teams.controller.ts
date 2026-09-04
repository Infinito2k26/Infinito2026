import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { CreateTeamDto, JoinTeamDto, UpdateTeamDto } from './dto/teams.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

const ROSTER_FILE_FIELDS = FileFieldsInterceptor(
  [
    { name: 'photo', maxCount: 1 },
    { name: 'idFile', maxCount: 1 },
    { name: 'secondaryIdFile', maxCount: 1 },
  ],
  { limits: { fileSize: 5 * 1024 * 1024 } },
);

const ALLOWED_ROSTER_FILE_TYPES = /^(image\/jpeg|image\/png|image\/webp)$/;

type RosterFiles = {
  photo?: Express.Multer.File[];
  idFile?: Express.Multer.File[];
  secondaryIdFile?: Express.Multer.File[];
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
  const secondaryIdFile = files.secondaryIdFile?.[0];
  if (!photo || !idFile || !secondaryIdFile) {
    throw new BadRequestException(
      'The "photo", "idFile", and "secondaryIdFile" files are all required',
    );
  }
  for (const [field, file] of [
    ['photo', photo],
    ['idFile', idFile],
    ['secondaryIdFile', secondaryIdFile],
  ] as const) {
    if (!ALLOWED_ROSTER_FILE_TYPES.test(file.mimetype)) {
      throw new BadRequestException(
        `"${field}" must be a JPEG, PNG, or WEBP image`,
      );
    }
  }
  return { photo, idFile, secondaryIdFile };
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
    const { photo, idFile, secondaryIdFile } = requireRosterFiles(uploaded);
    return this.teamsService.createTeam(
      req.user.id,
      body,
      photo,
      idFile,
      secondaryIdFile,
    );
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateTeamDto,
  ) {
    return this.teamsService.updateTeam(id, req.user.id, body);
  }

  @Post(':id/invitations')
  async rotateInvite(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.teamsService.rotateInviteCode(id, req.user.id);
  }

  @Delete(':teamId/participants/:participantId')
  async removeParticipant(
    @Req() req: AuthenticatedRequest,
    @Param('teamId', ParseUUIDPipe) teamId: string,
    @Param('participantId', ParseUUIDPipe) participantId: string,
  ) {
    await this.teamsService.removeParticipant(
      teamId,
      participantId,
      req.user.id,
    );
    return { success: true };
  }

  @Post('join')
  @UseInterceptors(ROSTER_FILE_FIELDS)
  async join(
    @Req() req: AuthenticatedRequest,
    @Body() body: JoinTeamDto,
    @UploadedFiles() uploaded: RosterFiles,
  ) {
    const { photo, idFile, secondaryIdFile } = requireRosterFiles(uploaded);
    return this.teamsService.join(
      body,
      req.user.id,
      photo,
      idFile,
      secondaryIdFile,
    );
  }
}
