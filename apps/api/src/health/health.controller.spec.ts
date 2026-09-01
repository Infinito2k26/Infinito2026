import { HealthController } from './health.controller';

interface MockPrisma {
  $queryRaw: jest.Mock<Promise<unknown>, [TemplateStringsArray]>;
}

interface MockRedis {
  ping: jest.Mock<Promise<string>, []>;
}

describe('HealthController', () => {
  let prisma: MockPrisma;
  let redis: MockRedis;
  let controller: HealthController;

  beforeEach(() => {
    prisma = { $queryRaw: jest.fn<Promise<unknown>, [TemplateStringsArray]>() };
    redis = { ping: jest.fn<Promise<string>, []>() };
    controller = new HealthController(prisma as never, redis as never);
  });

  it('reports ok when db and redis are both reachable', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockResolvedValue('PONG');

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      checks: { db: 'ok', redis: 'ok' },
    });
  });

  it('reports degraded when db fails', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    redis.ping.mockResolvedValue('PONG');

    await expect(controller.check()).resolves.toEqual({
      status: 'degraded',
      checks: { db: 'error', redis: 'ok' },
    });
  });

  it('reports degraded when redis fails', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    redis.ping.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(controller.check()).resolves.toEqual({
      status: 'degraded',
      checks: { db: 'ok', redis: 'error' },
    });
  });

  it('reports degraded with both checks errored when db and redis both fail', async () => {
    prisma.$queryRaw.mockRejectedValue(new Error('connection refused'));
    redis.ping.mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(controller.check()).resolves.toEqual({
      status: 'degraded',
      checks: { db: 'error', redis: 'error' },
    });
  });
});
