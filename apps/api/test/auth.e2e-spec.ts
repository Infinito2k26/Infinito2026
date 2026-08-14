import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import type {
  SuccessResponse,
  ErrorResponse,
} from './../src/common/envelope/envelope.types';
import type { UserProfile } from './../src/auth/auth.service';

async function createApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app: INestApplication<App> = moduleFixture.createNestApplication();
  app.setGlobalPrefix('api');
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.init();
  return app;
}

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('register -> login -> me (testing.md critical flow #1)', async () => {
    const email = `${randomUUID()}@infinito.dev`;
    const password = 'a-strong-password';

    const registerRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        name: 'E2E User',
        consent: true,
      })
      .expect(201);

    const registerBody = registerRes.body as SuccessResponse<UserProfile>;
    expect(registerBody.data.email).toBe(email);

    const agent = request.agent(app.getHttpServer());

    const loginRes = await agent
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const loginBody = loginRes.body as SuccessResponse<{
      accessToken: string;
      user: UserProfile;
    }>;

    expect(loginBody.data.accessToken).toBeDefined();
    expect(loginRes.headers['set-cookie']?.[0]).toMatch(/refresh_token=/);

    const meRes = await agent
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginBody.data.accessToken}`)
      .expect(200);

    const meBody = meRes.body as SuccessResponse<UserProfile>;
    expect(meBody.data.email).toBe(email);
  });

  it('duplicate register returns 409', async () => {
    const email = `${randomUUID()}@infinito.dev`;
    const password = 'a-strong-password';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        name: 'Dup User',
        consent: true,
      })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        name: 'Dup User',
        consent: true,
      })
      .expect(409);

    const body = res.body as ErrorResponse;
    expect(body.success).toBe(false);
  });

  it('wrong password returns 401', async () => {
    const email = `${randomUUID()}@infinito.dev`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'correct-password',
        name: 'Wrong Pass',
        consent: true,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password: 'incorrect-password',
      })
      .expect(401);
  });

  it('GET /auth/me without a token returns 401', async () => {
    await request(app.getHttpServer()).get('/api/auth/me').expect(401);
  });

  it('a replayed refresh token after rotation returns 401', async () => {
    const email = `${randomUUID()}@infinito.dev`;
    const password = 'a-strong-password';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password,
        name: 'Rotate User',
        consent: true,
      })
      .expect(201);

    const loginRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password })
      .expect(200);

    const originalCookie = (
      loginRes.headers['set-cookie'] as unknown as string[]
    )[0];

    // First use rotates the refresh token — succeeds.
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(200);

    // Replaying the same (now-rotated-away) cookie must be rejected.
    await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .set('Cookie', originalCookie)
      .expect(401);
  });

  it('register without consent returns 400', async () => {
    const email = `${randomUUID()}@infinito.dev`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'a-strong-password',
        name: 'No Consent',
      })
      .expect(400);
  });

  it('register with consent=false returns 400', async () => {
    const email = `${randomUUID()}@infinito.dev`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email,
        password: 'a-strong-password',
        name: 'False Consent',
        consent: false,
      })
      .expect(400);
  });
});

// Own app instance: the login endpoint's throttle bucket is per-process
// (in-memory ThrottlerStorage), so sharing an app with the tests above would
// let their login calls eat into this test's 10-request budget.
describe('Auth login throttling (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('throttles the 11th login attempt in a minute with 429', async () => {
    const email = `${randomUUID()}@infinito.dev`;

    for (let i = 0; i < 10; i++) {
      await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email,
          password: 'wrong-password',
        })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email,
        password: 'wrong-password',
      })
      .expect(429);
  }, 15000);
});