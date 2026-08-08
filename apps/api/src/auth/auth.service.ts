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
import { createHash, randomBytes, randomUUID } from 'crypto';
import { Env } from '../config/env.schema';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SetPasswordDto } from './dto/set-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpService } from './otp/otp.service';
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
    private readonly otpService: OtpService,
    private readonly mailService: MailService,
    @Inject(REFRESH_TOKEN_STORE)
    private readonly refreshStore: RefreshTokenStore,
  ) {}

  async register(dto: RegisterDto): Promise<{ message: string }> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('Email is already registered');
    }

    await this.prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        phone: dto.phone,
        college: dto.college,
      },
    });

    const otp = await this.otpService.generateAndStore(dto.email, 'register');
    await this.mailService.sendOtp(dto.email, otp);

    return { message: 'OTP sent to email for verification' };
  }

  async verifyOtp(dto: VerifyOtpDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) {
      throw new BadRequestException('No pending registration for this email');
    }
    if (user.isEmailVerified) {
      throw new ConflictException('Email is already verified');
    }

    const isValid = await this.otpService.verify(
      dto.email,
      'register',
      dto.otp,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        isEmailVerified: true,
      },
    });

    return {
      message: 'OTP verified successfully. Please set your password.',
    };
  }

  async setPassword(dto: SetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!user.isEmailVerified) {
      throw new BadRequestException('Email is not verified');
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { email: dto.email },
      data: {
        passwordHash,
      },
    });

    return {
      message: 'Password set successfully. You can now login.',
    };
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
    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }
    return toProfile(user);
  }

  async forgotPassword(email: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user) {
      const otp = await this.otpService.generateAndStore(
        email,
        'forgot-password',
      );
      await this.mailService.sendOtp(email, otp);
    }
    return { message: 'If an account exists, an OTP has been sent' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const isValid = await this.otpService.verify(
      dto.email,
      'forgot-password',
      dto.otp,
    );
    if (!isValid) {
      throw new BadRequestException('Invalid or expired OTP');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { email: dto.email },
      data: { passwordHash },
    });

    return { message: 'Password reset successful' };
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

    const refreshExpiry = this.config.get('JWT_REFRESH_EXPIRY', {
      infer: true,
    });
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
