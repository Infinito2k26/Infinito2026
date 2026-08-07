import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

const ENV = {
  JWT_ACCESS_SECRET: 'access-secret-at-least-32-characters-long',
  JWT_REFRESH_SECRET: 'refresh-secret-at-least-32-characters-long',
  JWT_ACCESS_EXPIRY: '15m',
  JWT_REFRESH_EXPIRY: '7d',
};

const baseUser = {
  id: 'user-1',
  email: 'test@infinito.dev',
  name: 'Test User',
  role: 'PARTICIPANT' as const,
  isEmailVerified: false,
  college: null as string | null,
  phone: null as string | null,
  passwordHash: '',
};
type MockUser = typeof baseUser;

interface MockPrisma {
  user: {
    findUnique: jest.Mock<Promise<MockUser | null>, [unknown]>;
    create: jest.Mock<Promise<MockUser>, [{ data: Partial<MockUser> }]>;
  };
}

interface MockRefreshStore {
  save: jest.Mock<Promise<void>, [string, string, Date]>;
  verify: jest.Mock<Promise<boolean>, [string, string]>;
  revoke: jest.Mock<Promise<void>, [string]>;
}

describe('AuthService', () => {
  let prisma: MockPrisma;
  let refreshStore: MockRefreshStore;
  let service: AuthService;

  beforeEach(async () => {
    baseUser.passwordHash = await bcrypt.hash('correct-password', 10);

    prisma = {
      user: {
        findUnique: jest.fn<Promise<MockUser | null>, [unknown]>(),
        create: jest.fn<Promise<MockUser>, [{ data: Partial<MockUser> }]>(),
      },
    };
    refreshStore = {
      save: jest.fn<Promise<void>, [string, string, Date]>(),
      verify: jest.fn<Promise<boolean>, [string, string]>(),
      revoke: jest.fn<Promise<void>, [string]>(),
    };
    const config = {
      get: jest.fn((key: keyof typeof ENV) => ENV[key]),
    };

    service = new AuthService(
      prisma as never,
      new JwtService(),
      config as never,
      refreshStore,
    );
  });

  describe('register', () => {
    it('hashes the password and creates the user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.create.mockImplementation(({ data }) =>
        Promise.resolve({ ...baseUser, ...data }),
      );

      await service.register({
        email: 'new@infinito.dev',
        name: 'New User',
      });

    });

    it('rejects a duplicate email with 409 Conflict', async () => {
      prisma.user.findUnique.mockResolvedValue(baseUser);

      await expect(
        service.register({
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
});
