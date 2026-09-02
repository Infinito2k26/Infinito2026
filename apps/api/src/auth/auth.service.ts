import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectQueue } from '@nestjs/bullmq';

import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';

import type { JwtSignOptions } from '@nestjs/jwt';

import { User } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { createHash, randomUUID } from 'crypto';

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
const EMAIL_VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: User['role'];
  isEmailVerified: boolean;
  college: string | null;
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
      throw new ConflictException('Email is already registered');
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
      },
    });

    await this.queueVerificationEmail(user);

    return toProfile(user);
  }

  async login(dto: LoginDto): Promise<TokenPair & { user: UserProfile }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (
      !user?.passwordHash ||
      !(await bcrypt.compare(dto.password, user.passwordHash))
    ) {
      throw new UnauthorizedException('Invalid email or password');
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

    const rawToken = randomUUID();
    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS),
      },
    });

    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true });
    const resetLink = `${webOrigin}/reset-password?token=${rawToken}`;

    await this.passwordResetEmailQueue.add('send', {
      email: user.email,
      resetLink,
    });
  }

  async resetPassword(dto: ResetPasswordDto): Promise<void> {
    const tokenHash = hashToken(dto.token);
    const resetToken = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);

    // A password reset invalidates any existing session — force re-login.
    await this.refreshStore.revoke(resetToken.userId);
  }

  async verifyEmail(dto: VerifyEmailDto): Promise<void> {
    const tokenHash = hashToken(dto.token);
    const verificationToken =
      await this.prisma.emailVerificationToken.findUnique({
        where: { tokenHash },
      });

    if (
      !verificationToken ||
      verificationToken.usedAt ||
      verificationToken.expiresAt < new Date()
    ) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: verificationToken.userId },
        data: { isEmailVerified: true },
      }),
      this.prisma.emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
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
    // isIITPVerified already proves a real institute email via Microsoft
    // OAuth — those users don't need the generic verification loop too.
    if (user.isEmailVerified || user.isIITPVerified) {
      return;
    }

    const rawToken = randomUUID();
    await this.prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(rawToken),
        expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TOKEN_TTL_MS),
      },
    });

    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true });
    const verifyLink = `${webOrigin}/verify-email?token=${rawToken}`;

    await this.emailVerificationQueue.add('send', {
      email: user.email,
      verifyLink,
    });
  }

  async me(userId: string): Promise<UserProfile> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return toProfile(user);
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
