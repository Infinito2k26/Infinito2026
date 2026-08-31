import { Prisma, ParticipantRole } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateTeamDto, JoinTeamDto } from './dto/teams.dto';

type UploadedFile = { buffer: Buffer; mimetype: string };

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  async listMine(userId: string) {
    return this.prisma.team.findMany({
      where: { captainId: userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        declaredSize: true,
        inviteCode: true,
        createdAt: true,
        event: { select: { id: true, name: true, slug: true } },
        participants: { select: { id: true } },
        registration: { select: { id: true, status: true } },
      },
    });
  }

  async listAll(page = 1, limit = 20) {
    page = Math.max(1, page);
    limit = Math.min(Math.max(1, limit), 100);
    const skip = (page - 1) * limit;

    const select = {
      id: true,
      name: true,
      declaredSize: true,
      inviteCode: true,
      createdAt: true,
      collegeName: true,
      captain: { select: { id: true, name: true, email: true } },
      event: { select: { id: true, name: true, slug: true } },
      participants: { select: { id: true } },
      registration: { select: { id: true, status: true } },
    } as const;

    const [teams, total] = await this.prisma.$transaction([
      this.prisma.team.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select,
      }),
      this.prisma.team.count({ where: { deletedAt: null } }),
    ]);

    return {
      teams,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createTeam(
    userId: string,
    dto: CreateTeamDto,
    photoFile: UploadedFile,
    idFile: UploadedFile,
  ) {
    const event = await this.prisma.event.findUnique({
      where: { id: dto.eventId },
    });
    if (!event || event.deletedAt) {
      throw new NotFoundException('Event not found');
    }
    if (!event.isPublished) {
      throw new BadRequestException(
        'Cannot create a team for an unpublished event',
      );
    }
    if (event.teamSizeMin != null && dto.declaredSize < event.teamSizeMin) {
      throw new UnprocessableEntityException(
        `declaredSize must be at least ${event.teamSizeMin} for this event`,
      );
    }
    if (event.teamSizeMax != null && dto.declaredSize > event.teamSizeMax) {
      throw new UnprocessableEntityException(
        `declaredSize cannot exceed ${event.teamSizeMax} for this event`,
      );
    }

    const captain = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, phone: true },
    });

    const [photoUpload, idUpload] = await Promise.all([
      this.uploadsService.uploadProof(
        photoFile.buffer,
        photoFile.mimetype,
        'participant-photo',
      ),
      this.uploadsService.uploadProof(
        idFile.buffer,
        idFile.mimetype,
        'participant-id',
      ),
    ]);

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const inviteCode = generateInviteCode();
      try {
        return await this.prisma.$transaction(async (tx) => {
          const team = await tx.team.create({
            data: {
              eventId: dto.eventId,
              declaredSize: dto.declaredSize,
              name: dto.name,
              captainId: userId,
              collegeName: dto.collegeName,
              collegeAddress: dto.collegeAddress,
              isIITP: dto.isIITP ?? false,
              viceCaptainName: dto.viceCaptainName,
              viceCaptainPhone: dto.viceCaptainPhone,
              coachName: dto.coachName,
              coachPhone: dto.coachPhone,
              inviteCode,
            },
          });

          const captainParticipant = await tx.participant.create({
            data: {
              teamId: team.id,
              name: captain.name,
              phone: captain.phone,
              role: ParticipantRole.CAPTAIN,
              isRequired: true,
              userId,
              photoUrl: photoUpload.key,
              idType: dto.idType,
              idNumber: dto.idNumber,
              idFileUrl: idUpload.key,
            },
          });

          return { team, captain: captainParticipant };
        });
      } catch (err) {
        const isInviteCodeCollision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          (err.meta?.target as string[] | undefined)?.includes('inviteCode');

        if (isInviteCodeCollision && attempt < maxAttempts) {
          continue;
        }
        throw err;
      }
    }

    // Unreachable — loop always returns or throws.
    throw new ConflictException(
      'Could not generate a unique invite code, please retry',
    );
  }

  async rotateInviteCode(teamId: string, callerId: string) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.deletedAt) {
      throw new NotFoundException('Team not found');
    }
    if (team.captainId !== callerId) {
      throw new ForbiddenException(
        'Only the team captain can rotate the invite code',
      );
    }

    const maxAttempts = 2;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const inviteCode = generateInviteCode();
      try {
        return await this.prisma.team.update({
          where: { id: teamId },
          data: { inviteCode },
        });
      } catch (err) {
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          attempt < maxAttempts
        ) {
          continue;
        }
        throw err;
      }
    }

    throw new ConflictException(
      'Could not generate a unique invite code, please retry',
    );
  }

  async join(
    teamId: string,
    dto: JoinTeamDto,
    userId: string,
    photoFile: UploadedFile,
    idFile: UploadedFile,
  ) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: { event: { select: { teamSizeMax: true } } },
    });
    if (!team || team.deletedAt) {
      throw new NotFoundException('Team not found');
    }
    if (team.inviteCode !== dto.inviteCode) {
      throw new ForbiddenException('Invalid invite code');
    }

    const joiner = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { name: true, phone: true },
    });

    const [photoUpload, idUpload] = await Promise.all([
      this.uploadsService.uploadProof(
        photoFile.buffer,
        photoFile.mimetype,
        'participant-photo',
      ),
      this.uploadsService.uploadProof(
        idFile.buffer,
        idFile.mimetype,
        'participant-id',
      ),
    ]);

    return this.prisma.$transaction(async (tx) => {
      const rosterCount = await tx.participant.count({ where: { teamId } });
      const teamSizeMax = team.event.teamSizeMax;

      if (teamSizeMax !== null && rosterCount >= teamSizeMax) {
        throw new ConflictException('This team roster is already full');
      }

      return tx.participant.create({
        data: {
          teamId,
          name: joiner.name,
          phone: joiner.phone,
          role: ParticipantRole.PLAYER,
          isRequired: true,
          userId,
          photoUrl: photoUpload.key,
          idType: dto.idType,
          idNumber: dto.idNumber,
          idFileUrl: idUpload.key,
        },
      });
    });
  }
}
