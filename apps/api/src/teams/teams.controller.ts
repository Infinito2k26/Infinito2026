import {
  Controller,
  Post,
  Body,
  Req,
  Param,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipeBuilder,
  HttpStatus,
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

const ROSTER_FILE_PIPE = new ParseFilePipeBuilder()
  .addFileTypeValidator({ fileType: /^(image\/jpeg|image\/png|image\/webp)$/ })
  .build({
    fileIsRequired: false,
    errorHttpStatusCode: HttpStatus.BAD_REQUEST,
  });

type RosterFiles = {
  photo?: Express.Multer.File[];
  idFile?: Express.Multer.File[];
};

function requireRosterFiles(files: RosterFiles) {
  const photo = files.photo?.[0];
  const idFile = files.idFile?.[0];
  if (!photo || !idFile) {
    throw new BadRequestException(
      'Both "photo" and "idFile" files are required',
    );
  }
  return { photo, idFile };
}

@Controller('teams')
@UseGuards(JwtAuthGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @UseInterceptors(ROSTER_FILE_FIELDS)
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateTeamDto,
    @UploadedFiles(ROSTER_FILE_PIPE) uploaded: RosterFiles,
  ) {
    const { photo, idFile } = requireRosterFiles(uploaded);
    return this.teamsService.createTeam(req.user.id, body, photo, idFile);
  }

  @Post(':id/invitations')
  async rotateInvite(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    return this.teamsService.rotateInviteCode(id, req.user.id);
  }

  @Post(':id/join')
  @UseInterceptors(ROSTER_FILE_FIELDS)
  async join(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: JoinTeamDto,
    @UploadedFiles(ROSTER_FILE_PIPE) uploaded: RosterFiles,
  ) {
    const { photo, idFile } = requireRosterFiles(uploaded);
    return this.teamsService.join(id, body, req.user.id, photo, idFile);
  }
}
