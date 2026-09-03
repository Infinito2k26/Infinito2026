import { Prisma, ParticipantRole, RegistrationStatus } from '@prisma/client';
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { CreateTeamDto, JoinTeamDto, UpdateTeamDto } from './dto/teams.dto';

type UploadedFile = { buffer: Buffer; mimetype: string };

function generateInviteCode(): string {
  return crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 chars
}

@Injectable()
export class TeamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    @InjectQueue('payment-confirmed')
    private readonly paymentConfirmedQueue: Queue,
  ) {}

  async listMine(userId: string) {
    const teams = await this.prisma.team.findMany({
      where: {
        deletedAt: null,
        OR: [{ captainId: userId }, { participants: { some: { userId } } }],
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        declaredSize: true,
        inviteCode: true,
        createdAt: true,
        captainId: true,
        collegeName: true,
        collegeAddress: true,
        isIITP: true,
        viceCaptainName: true,
        viceCaptainPhone: true,
        coachName: true,
        coachPhone: true,
        event: {
          select: {
            id: true,
            name: true,
            slug: true,
            teamSizeMin: true,
            teamSizeMax: true,
          },
        },
        participants: { select: { id: true, name: true, role: true } },
        registration: { select: { id: true, status: true } },
      },
    });

    // Members only need their captain's invite code to invite others if
    // they *are* the captain — showing it to every joined member leaks a
    // credential that lets anyone claim a roster slot.
    return teams.map(({ captainId, ...team }) => ({
      ...team,
      role: captainId === userId ? ('CAPTAIN' as const) : ('MEMBER' as const),
      inviteCode: captainId === userId ? team.inviteCode : null,
    }));
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

    // Without this, a captain could create a new team for the same event on
    // every click, registering (and paying for) each one — unlimited
    // registrations into one event. Only a cancelled/refunded prior team
    // frees up a retry.
    const existingTeam = await this.prisma.team.findFirst({
      where: {
        eventId: dto.eventId,
        captainId: userId,
        deletedAt: null,
        OR: [
          { registration: null },
          {
            registration: {
              status: {
                notIn: [
                  RegistrationStatus.CANCELLED,
                  RegistrationStatus.REFUNDED,
                ],
              },
            },
          },
        ],
      },
      select: { id: true },
    });
    if (existingTeam) {
      throw new ConflictException(
        'You already have a team for this event — use that one instead of creating another',
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

  async updateTeam(teamId: string, callerId: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findUnique({
      where: { id: teamId },
      include: {
        event: { select: { teamSizeMin: true, teamSizeMax: true } },
        registration: { select: { id: true } },
        _count: { select: { participants: true } },
      },
    });
    if (!team || team.deletedAt) {
      throw new NotFoundException('Team not found');
    }
    if (team.captainId !== callerId) {
      throw new ForbiddenException('Only the team captain can edit the team');
    }
    if (team.registration) {
      throw new ConflictException(
        'Team details can no longer be edited — this team has already been registered',
      );
    }

    if (dto.declaredSize !== undefined) {
      if (
        team.event.teamSizeMin != null &&
        dto.declaredSize < team.event.teamSizeMin
      ) {
        throw new UnprocessableEntityException(
          `declaredSize must be at least ${team.event.teamSizeMin} for this event`,
        );
      }
      if (
        team.event.teamSizeMax != null &&
        dto.declaredSize > team.event.teamSizeMax
      ) {
        throw new UnprocessableEntityException(
          `declaredSize cannot exceed ${team.event.teamSizeMax} for this event`,
        );
      }
      if (dto.declaredSize < team._count.participants) {
        throw new UnprocessableEntityException(
          `declaredSize cannot be less than the ${team._count.participants} member(s) already on the roster`,
        );
      }
    }

    return this.prisma.team.update({
      where: { id: teamId },
      data: {
        name: dto.name,
        declaredSize: dto.declaredSize,
        collegeName: dto.collegeName,
        collegeAddress: dto.collegeAddress,
        isIITP: dto.isIITP,
        viceCaptainName: dto.viceCaptainName,
        viceCaptainPhone: dto.viceCaptainPhone,
        coachName: dto.coachName,
        coachPhone: dto.coachPhone,
      },
    });
  }

  async removeParticipant(
    teamId: string,
    participantId: string,
    callerId: string,
  ) {
    const team = await this.prisma.team.findUnique({ where: { id: teamId } });
    if (!team || team.deletedAt) {
      throw new NotFoundException('Team not found');
    }
    if (team.captainId !== callerId) {
      throw new ForbiddenException(
        'Only the team captain can remove team members',
      );
    }

    const participant = await this.prisma.participant.findUnique({
      where: { id: participantId },
    });
    if (!participant || participant.teamId !== teamId) {
      throw new NotFoundException('Participant not found on this team');
    }
    if (participant.role === ParticipantRole.CAPTAIN) {
      throw new BadRequestException(
        'The captain cannot be removed from the team',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      // A credential may already have scan history (ScanLog rows) attached —
      // those reference the credential via a plain FK with no cascade, so
      // they're cleared first or the credential delete below would fail.
      const credential = await tx.credential.findUnique({
        where: { participantId },
      });
      if (credential) {
        await tx.scanLog.deleteMany({ where: { credentialId: credential.id } });
        await tx.credential.delete({ where: { id: credential.id } });
      }
      await tx.participant.delete({ where: { id: participantId } });
    });
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
    dto: JoinTeamDto,
    userId: string,
    photoFile: UploadedFile,
    idFile: UploadedFile,
  ) {
    // Invite code is already a unique, unguessable credential — asking for
    // the raw team ID as well just makes the join form harder to fill in
    // for no added safety.
    const team = await this.prisma.team.findUnique({
      where: { inviteCode: dto.inviteCode },
      include: {
        event: { select: { teamSizeMax: true } },
        registration: { select: { id: true, status: true } },
      },
    });
    if (!team || team.deletedAt) {
      throw new NotFoundException('Invalid invite code');
    }

    const teamId = team.id;
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

    const participant = await this.prisma.$transaction(async (tx) => {
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

    // The captain's payment confirmation fires credential issuance once,
    // for whoever's on the roster at that moment — someone joining later
    // (the flow explicitly lets teammates join after the captain
    // registers) would otherwise never get a QR credential at all. Same
    // job, re-enqueued; issueCredentialsForPayment() skips anyone who
    // already has one, so this is a safe no-op for the rest of the team.
    if (team.registration && team.registration.status === 'CONFIRMED') {
      await this.paymentConfirmedQueue.add('payment-confirmed', {
        registrationId: team.registration.id,
      });
    }

    return participant;
  }
}
