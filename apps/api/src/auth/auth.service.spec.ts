import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'refresh-secret-at-least-32-characters-long',
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d',
  WEB_ORIGIN: 'http://localhost:3001',
};

interface MockResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  failedAttempts?: number;
}

const baseUser = {
  id: 'user-1',
  email: 'test@infinito.dev',
  name: 'Test User',
  role: 'PARTICIPANT' as const,
  isEmailVerified: false,
  bannedAt: null as Date | null,
  college: null as string | null,
  phone: null as string | null,
  passwordHash: '',
};
type MockUser = typeof baseUser;

interface MockPrisma {
  user: {
    findUnique: jest.Mock<Promise<MockUser | null>, [unknown]>;
    create: jest.Mock<Promise<MockUser>, [{ data: Partial<MockUser> }]>;
    update: jest.Mock<Promise<MockUser>, [{ data: Partial<MockUser> }]>;
  };
  passwordResetToken: {
    create: jest.Mock<Promise<MockResetToken>, [unknown]>;
    findUnique: jest.Mock<Promise<MockResetToken | null>, [unknown]>;
    findFirst: jest.Mock<Promise<MockResetToken | null>, [unknown]>;
    update: jest.Mock<Promise<MockResetToken>, [unknown]>;
  };
  $transaction: jest.Mock<Promise<unknown[]>, [Promise<unknown>[]]>;
}

interface MockRefreshStore {
  save: jest.Mock<Promise<void>, [string, string, Date]>;
  verify: jest.Mock<Promise<boolean>, [string, string]>;
  revoke: jest.Mock<Promise<void>, [string]>;
}

describe('AuthService', () => {
  let prisma: MockPrisma;
  let refreshStore: MockRefreshStore;
  let passwordResetEmailQueue: {
    add: jest.Mock<Promise<void>, [string, { email: string; code: string }]>;
  };
  let service: AuthService;

  beforeEach(async () => {
    baseUser.passwordHash = await bcrypt.hash('correct-password', 10);

    prisma = {
      user: {
        findUnique: jest.fn<Promise<MockUser | null>, [unknown]>(),
        create: jest.fn<Promise<MockUser>, [{ data: Partial<MockUser> }]>(),
        update: jest.fn<Promise<MockUser>, [{ data: Partial<MockUser> }]>(),
      },
      passwordResetToken: {
        create: jest.fn<Promise<MockResetToken>, [unknown]>(),
        findUnique: jest.fn<Promise<MockResetToken | null>, [unknown]>(),
        findFirst: jest.fn<Promise<MockResetToken | null>, [unknown]>(),
        update: jest.fn<Promise<MockResetToken>, [unknown]>(),
      },
      $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
    };
    refreshStore = {
      save: jest.fn<Promise<void>, [string, string, Date]>(),
      verify: jest.fn<Promise<boolean>, [string, string]>(),
      revoke: jest.fn<Promise<void>, [string]>(),
    };
    const config = {
      get: jest.fn((key: keyof typeof ENV) => ENV[key]),
    };

    passwordResetEmailQueue = {
      add: jest.fn<Promise<void>, [string, { email: string; code: string }]>(),
    };

    service = new AuthService(
      prisma as never,
      new JwtService(),
      config as never,
      refreshStore,
      passwordResetEmailQueue as never,
    );
  });

  describe('register', () => {
    it('hashes the password and creates the user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...baseUser, ...data }),
      );

      await service.register({
        consent: true,
        email: 'new@infinito.dev',
        password: 'plaintext-password',
        name: 'New User',
      });

      const createdData = prisma.user.create.mock.calls[0][0].data;
      expect(createdData.passwordHash).not.toBe('plaintext-password');
      expect(
        await bcrypt.compare('plaintext-password', createdData.passwordHash!),
      ).toBe(true);
    });

    it('rejects a duplicate email with 409 Conflict', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({
          consent: true,
          email: baseUser.email,
          password: 'plaintext-password',
          name: 'Dup User',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('login', () => {
    it('rejects a bad password with 401', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.login({ email: baseUser.email, password: 'wrong-password' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues an access token carrying sub and role, and stores the refresh token', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      const result = await service.login({
        email: baseUser.email,
        password: 'correct-password',
      });

      const jwt = new JwtService();
      const accessPayload = jwt.decode<{ sub: string; role: string }>(
        result.accessToken,
      );
      expect(accessPayload.sub).toBe(baseUser.id);
      expect(accessPayload.role).toBe(baseUser.role);
      expect(refreshStore.save).toHaveBeenCalledWith(
        baseUser.id,
        expect.any(String),
        expect.any(Date),
      );
    });

    it('rejects a banned user with 403', async () => {
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        bannedAt: new Date(),
      });

      await expect(
        service.login({
          email: baseUser.email,
          password: 'correct-password',
        }),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(refreshStore.save).not.toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('rotates the refresh token and revokes the old one', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const { refreshToken } = await service.login({
        email: baseUser.email,
        password: 'correct-password',
      });

      refreshStore.verify.mockResolvedValue(true);

      await service.refresh(refreshToken);

      expect(refreshStore.revoke).toHaveBeenCalledWith(baseUser.id);
      expect(refreshStore.save).toHaveBeenCalledTimes(2);
    });

    it('rejects and revokes the session when the user was banned after login', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const { refreshToken } = await service.login({
        email: baseUser.email,
        password: 'correct-password',
      });

      refreshStore.verify.mockResolvedValue(true);
      prisma.user.findUnique.mockResolvedValue({
        ...baseUser,
        bannedAt: new Date(),
      });

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(refreshStore.revoke).toHaveBeenCalledWith(baseUser.id);
    });

    it('rejects a refresh token the store no longer recognizes (already rotated)', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      const { refreshToken } = await service.login({
        email: baseUser.email,
        password: 'correct-password',
      });

      refreshStore.verify.mockResolvedValue(false);

      await expect(service.refresh(refreshToken)).rejects.toBeInstanceOf(
        UnauthorizedException,
      );
    });
  });

  describe('forgotPassword', () => {
    it('creates a reset token and enqueues an email when the user exists', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.passwordResetToken.create.mockResolvedValue({
        id: 'reset-1',
        userId: baseUser.id,
        tokenHash: 'hash',
        expiresAt: new Date(Date.now() + 1000),
        usedAt: null,
      });

      await service.forgotPassword({ email: baseUser.email });

      expect(prisma.passwordResetToken.create).toHaveBeenCalledTimes(1);
      const [jobName, jobData] = passwordResetEmailQueue.add.mock.calls[0];
      expect(jobName).toBe('send');
      expect(jobData.email).toBe(baseUser.email);
      expect(jobData.code).toMatch(/^\d{6}$/);
    });

    it('does nothing (no token, no email) for an unregistered address, to avoid enumeration', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await service.forgotPassword({ email: 'nobody@infinito.dev' });

      expect(prisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(passwordResetEmailQueue.add).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    const validCode = '123456';
    const validResetToken: MockResetToken = {
      id: 'reset-1',
      userId: baseUser.id,
      tokenHash: createHash('sha256').update(validCode).digest('hex'),
      expiresAt: new Date(Date.now() + 1000 * 60),
      usedAt: null,
      failedAttempts: 0,
    };

    it('updates the password and revokes existing sessions on the correct code', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.passwordResetToken.findFirst.mockResolvedValue(validResetToken);

      await service.resetPassword({
        email: baseUser.email,
        code: validCode,
        newPassword: 'new-plaintext-password',
      });

      const updateData = prisma.user.update.mock.calls[0][0].data;
      expect(
        await bcrypt.compare(
          'new-plaintext-password',
          updateData.passwordHash!,
        ),
      ).toBe(true);
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: validResetToken.id },
        data: { usedAt: expect.any(Date) as Date },
      });
      expect(refreshStore.revoke).toHaveBeenCalledWith(baseUser.id);
    });

    it('rejects an unregistered email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: 'nobody@infinito.dev',
          code: validCode,
          newPassword: 'x'.repeat(8),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects when no active (unexpired, unused) token exists for the user', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.passwordResetToken.findFirst.mockResolvedValue(null);

      await expect(
        service.resetPassword({
          email: baseUser.email,
          code: validCode,
          newPassword: 'x'.repeat(8),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects and increments failedAttempts on a wrong code', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.passwordResetToken.findFirst.mockResolvedValue(validResetToken);

      await expect(
        service.resetPassword({
          email: baseUser.email,
          code: '000000',
          newPassword: 'x'.repeat(8),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.passwordResetToken.update).toHaveBeenCalledWith({
        where: { id: validResetToken.id },
        data: { failedAttempts: { increment: 1 } },
      });
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('rejects once the token has hit the failed-attempt limit, even with the right code', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);
      prisma.passwordResetToken.findFirst.mockResolvedValue({
        ...validResetToken,
        failedAttempts: 5,
      });

      await expect(
        service.resetPassword({
          email: baseUser.email,
          code: validCode,
          newPassword: 'x'.repeat(8),
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });
  });
});
