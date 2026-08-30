import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as QRCode from 'qrcode';
import { ScanResult } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UploadsService } from '../uploads/uploads.service';
import { TokenService } from './token.service';
import { ScanDto } from './dto/scan.dto';

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

  async scan(scannedById: string, dto: ScanDto) {
    const verification = this.tokenService.verifyToken(dto.token);
    if (!verification.valid) {
      throw new BadRequestException('Invalid or tampered credential token');
    }

    const credential = await this.prisma.credential.findUnique({
      where: { tokenHash: hashToken(dto.token) },
    });

    if (!credential) {
      throw new NotFoundException('Credential not found');
    }

    return this.prisma.$transaction(async (tx) => {
      const lastScan = await tx.scanLog.findFirst({
        where: { credentialId: credential.id },
        orderBy: { createdAt: 'desc' },
      });

      // A gate direction can't repeat without the opposite direction in
      // between (e.g. two ENTRY scans in a row with no EXIT) — that's a
      // re-used/shared QR, not a legitimate second pass through the gate.
      const isDuplicate =
        lastScan?.result === ScanResult.VALID &&
        lastScan.direction === dto.direction;
      const result = isDuplicate ? ScanResult.DUPLICATE : ScanResult.VALID;

      const scanLog = await tx.scanLog.create({
        data: {
          credentialId: credential.id,
          scannedById,
          gate: dto.gate,
          direction: dto.direction,
          result,
        },
      });

      if (result === ScanResult.VALID) {
        await tx.credential.update({
          where: { id: credential.id },
          data: { scanCount: { increment: 1 }, lastScannedAt: new Date() },
        });
      }

      return {
        result,
        scanLogId: scanLog.id,
        credentialId: credential.id,
        gate: dto.gate,
        direction: dto.direction,
      };
    });
  }
}
