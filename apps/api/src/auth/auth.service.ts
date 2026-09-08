import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { Prisma } from '@prisma/client';

import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';

import type { JwtSignOptions } from '@nestjs/jwt';

import { User } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { createHash, randomInt, randomUUID } from 'crypto';

import type { Queue } from 'bullmq';

import { Env } from '../config/env.schema';

import { PrismaService } from '../prisma/prisma.service';

import { ForgotPasswordDto } from './dto/forgot-password.dto';

import { LoginDto } from './dto/login.dto';

import { RegisterDto } from './dto/register.dto';

import { ResetPasswordDto } from './dto/reset-password.dto';

import { VerifyEmailDto } from './dto/verify-email.dto';

import { REFRESH_TOKEN_STORE } from './refresh-token-store.interface';

import type { RefreshTokenStore } from './refresh-token-store.interface';

const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 5 * 60 * 1000;
const MAX_RESET_ATTEMPTS = 5;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: User['role'];
  isEmailVerified: boolean;
  college: string | null;
  customRole?: {
    id: string;
    name: string;
    permissions: {
      service: string;
      canRead: boolean;
      canWrite: boolean;
      canDelete: boolean;
    }[];
  } | null;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

function toProfile(user: User): UserProfile {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    college: user.college,
  };
}

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshStore: RefreshTokenStore,
    @InjectQueue('password-reset-email')
    private readonly passwordResetEmailQueue: Queue,
    @InjectQueue('email-verification')
    private readonly emailVerificationQueue: Queue,
  ) {}

  async register(dto: RegisterDto): Promise<UserProfile> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.isEmailVerified) {
        throw new ConflictException('Email is already registered');
      }

      const hasActivity = await this.prisma.user.findFirst({
        where: {
          id: existing.id,
          OR: [
            { captainedTeams: { some: {} } },
            { caProfile: { isNot: null } },
            { registrations: { some: {} } },
            { credentials: { some: {} } },
            { scansDone: { some: {} } },
            { rulebooksUploaded: { some: {} } },
            { taskVerifications: { some: {} } },
            { participants: { some: {} } },
            { caApplications: { some: {} } },
            { caApplicationsReviewed: { some: {} } },
            { merchOrders: { some: {} } },
            { auditLogsAsActor: { some: {} } },
            { auditLogsAsTarget: { some: {} } },
            { siteSettingsUpdates: { some: {} } },
          ],
        },
      });

      if (hasActivity) {
        throw new ConflictException('Email is already registered');
      }

      await this.prisma.emailVerificationToken.deleteMany({
        where: {
          userId: existing.id,
        },
      });

      await this.prisma.user.delete({
        where: { id: existing.id },
      });
    }

    if (dto.consent !== true) {
      throw new BadRequestException('Consent is required');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        college: dto.college,
        consentedAt: new Date(),
        verificationExpiresAt: new Date(Date.now() + 5 * 60 * 1000),
      },
    });

    await this.queueVerificationEmail(user);

    return toProfile(user);
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: UserProfile }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email not found');
    }

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not found');
    }

    if (
      !user.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.bannedAt) {
      throw new ForbiddenException('This account has been suspended');
    }

    const tokens = await this.issueTokens(user);
    return { ...tokens, user: toProfile(user) };
  }

  async refresh(refreshToken: string): Promise<TokenPair> {
    const payload = await this.verifyRefreshToken(refreshToken);

    const valid = await this.refreshStore.verify(
      payload.sub,
      hashToken(refreshToken),
    );

    if (!valid) {
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    if (user.bannedAt) {
      await this.refreshStore.revoke(user.id);
      throw new ForbiddenException('This account has been suspended');
    }

    await this.refreshStore.revoke(user.id);
    return this.issueTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.refreshStore.revoke(userId);
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always behave the same way regardless of whether the email exists,
    // so this endpoint can't be used to enumerate registered accounts.
    if (!user) {
      return;
    }

    // A 6-digit code the user types back in, not a link — sidesteps two
    // link-based failure modes: email security scanners auto-clicking (and
    // burning) a single-use link, and a link opened on a different device
    // than the one mid-login-flow.
    const rawCode = randomInt(100000, 999999).toString();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawCode),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });

    await this.passwordResetEmailQueue.add('send', {
      email: user.email,
      code: rawCode,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired code');
    }

    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetToken || resetToken.failedAttempts >= MAX_RESET_ATTEMPTS) {
      throw new BadRequestException('Invalid or expired code');
    }

    if (resetToken.tokenHash !== hashToken(dto.code)) {
      await this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { failedAttempts: { increment: 1 } },
      });
      throw new BadRequestException('Invalid or expired code');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // A password reset invalidates any existing session — force re-login.
    await this.refreshStore.revoke(user.id);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const verificationToken =
      await this.prisma.emailVerificationToken.findFirst({
        where: {
          user: {
            email: dto.email,
          },
          usedAt: null,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

    if (!verificationToken) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // OTP expired → delete user
    if (verificationToken.expiresAt < new Date()) {
      await this.prisma.user.delete({
        where: { id: verificationToken.userId },
      });

      throw new BadRequestException('OTP expired. Please register again.');
    }

    // Wrong OTP
    if (verificationToken.tokenHash !== hashToken(dto.code)) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: {
          isEmailVerified: true,
          verificationExpiresAt: null,
        },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);
  }
  async resendVerification(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Always behave the same way regardless of whether the email exists or
    // is already verified, so this endpoint can't be used to enumerate accounts.
    if (!user || user.isEmailVerified || user.isIITPVerified) {
      return;
    }

    await this.queueVerificationEmail(user);
  }

  private async queueVerificationEmail(user: User): Promise<void> {
    if (user.isEmailVerified || user.isIITPVerified) {
      return;
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const rawCode = randomInt(100000, 999999).toString();

      try {
        await this.prisma.emailVerificationToken.create({
          data: {
            userId: user.id,
            tokenHash: hashToken(rawCode),
            expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
          },
        });

        await this.emailVerificationQueue.add('send', {
          email: user.email,
          code: rawCode,
        });

        return;
      } catch (error: unknown) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          continue;
        }

        throw error;
      }
    }

    throw new BadRequestException(
      'Unable to generate a unique verification OTP. Please try again.',
    );
  }

  async me(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        customRole: {
          select: {
            id: true,
            name: true,
            deletedAt: true,
            permissions: {
              select: {
                service: true,
                canRead: true,
                canWrite: true,
                canDelete: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return {
      ...toProfile(user),
      customRole:
        user.customRole && !user.customRole.deletedAt
          ? {
              id: user.customRole.id,
              name: user.customRole.name,
              permissions: user.customRole.permissions,
            }
          : null,
    };
  }

  private async issueTokens(user: User): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, role: user.role },
      {
        secret: this.config.get('JWT_ACCESS_SECRET', { infer: true }),
        expiresIn: this.config.get('JWT_ACCESS_EXPIRY', {
          infer: true,
        }),
      },
    );

    // ponytail: cast is load-bearing (randomUUID()'s branded UUID payload type
    // pushes signAsync onto the JwtSignOptions overload); eslint's
    // no-unnecessary-type-assertion false-positives here and --fix strips it.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const refreshExpiry = this.config.get('JWT_REFRESH_EXPIRY', {
      infer: true,
    }) as JwtSignOptions['expiresIn'];

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, jti: randomUUID() },
      {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
        expiresIn: refreshExpiry,
      },
    );

    const { exp } = this.jwt.decode<{ exp: number }>(refreshToken);

    const refreshTokenExpiresAt = new Date(exp * 1000);

    await this.refreshStore.save(
      user.id,
      hashToken(refreshToken),
      refreshTokenExpiresAt,
    );

    return { accessToken, refreshToken, refreshTokenExpiresAt };
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ sub: string; jti: string }> {
    try {
      return await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get('JWT_REFRESH_SECRET', { infer: true }),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }
}
