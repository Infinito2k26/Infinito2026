import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { TokenService } from './token.service';

function hashToken(rawToken: string): string {
  return createHash('sha256').update(rawToken).digest('hex');
}

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
    private readonly tokenService: TokenService,
  ) {}

  async issueCredentialsForPayment(registrationId: string): Promise<void> {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { team: { include: { participants: true } } },
    });

    if (!registration) {
      this.logger.warn(
        `Registration ${registrationId} not found; skipping credential issuance`,
      );
      return;
    }

    if (registration.userId) {
      await this.issueCredential({
        registrationId,
        userId: registration.userId,
      });
      return;
    }

    if (registration.team) {
      for (const participant of registration.team.participants) {
        await this.issueCredential({
          registrationId,
          participantId: participant.id,
        });
      }
    }
  }

  private async issueCredential(target: {
    registrationId: string;
    userId?: string;
    participantId?: string;
  }): Promise<void> {
    const existing = await this.prisma.credential.findUnique({
      where: target.userId
        ? { userId: target.userId }
        : { participantId: target.participantId! },
    });

    if (existing) {
      return;
    }

    const credentialId = randomUUID();
    const rawToken = this.tokenService.signToken(credentialId);
    const tokenHash = hashToken(rawToken);
    const qrBuffer = await QRCode.toBuffer(rawToken, {
      type: 'png',
      errorCorrectionLevel: 'M',
    });
    const uploaded = await this.uploadsService.uploadProof(
      qrBuffer,
      'image/png',
      'qr-codes',
    );

    await this.prisma.credential.create({
      data: {
        id: credentialId,
        registrationId: target.registrationId,
        userId: target.userId ?? null,
        participantId: target.participantId ?? null,
        tokenHash,
        qrImageUrl: uploaded.key,
      },
    });
  }

  async getMyCredential(userId: string) {
    let credential = await this.prisma.credential.findUnique({
      where: { userId },
    });

    if (!credential) {
      const participant = await this.prisma.participant.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        select: { id: true },
      });

      if (participant) {
        credential = await this.prisma.credential.findUnique({
          where: { participantId: participant.id },
        });
      }
    }

    if (!credential) {
      throw new NotFoundException(
        'No credential issued yet. It is generated once your payment is confirmed.',
      );
    }

    return {
      id: credential.id,
      scanCount: credential.scanCount,
      lastScannedAt: credential.lastScannedAt,
      qrImageUrl: this.uploadsService.getSignedGetUrl(credential.qrImageUrl),
      createdAt: credential.createdAt,
    };
  }

  async validateToken(rawToken: string) {
    const result = this.tokenService.verifyToken(rawToken);
    if (!result.valid) {
      return { valid: false };
    }

    const credential = await this.prisma.credential.findUnique({
      where: { tokenHash: hashToken(rawToken) },
      include: {
        user: { select: { name: true } },
        participant: { select: { name: true } },
      },
    });

    if (!credential) {
      return { valid: false };
    }

    return {
      valid: true,
      credentialId: credential.id,
      holderName: credential.user?.name ?? credential.participant?.name ?? null,
      scanCount: credential.scanCount,
      lastScannedAt: credential.lastScannedAt,
    };
  }
}
