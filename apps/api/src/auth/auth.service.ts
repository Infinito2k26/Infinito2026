import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';

import type { JwtSignOptions } from '@nestjs/jwt';

import { User } from '@prisma/client';

import * as bcrypt from 'bcrypt';

import { createHash, randomUUID } from 'crypto';

import { Env } from '../config/env.schema';

import { PrismaService } from '../prisma/prisma.service';

import { LoginDto } from './dto/login.dto';

import { RegisterDto } from './dto/register.dto';

import { REFRESH_TOKEN_STORE } from './refresh-token-store.interface';

import type { RefreshTokenStore } from './refresh-token-store.interface';

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
