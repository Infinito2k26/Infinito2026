import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { UserRole } from '@prisma/client';
import { PrismaService } from './../src/prisma/prisma.service';
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
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
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

  it('admin can promote a user, while participant gets 403', async () => {
    const adminEmail = `${randomUUID()}@infinito.dev`;
    const targetEmail = `${randomUUID()}@infinito.dev`;
    const password = 'a-strong-password';

    // Create admin candidate.
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: adminEmail,
        password,
        name: 'E2E Admin',
        consent: true,
      })
      .expect(201);

    // Create target participant.
    const targetRes = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: targetEmail,
        password,
        name: 'E2E Target',
        consent: true,
      })
      .expect(201);

    const targetBody = targetRes.body as SuccessResponse<UserProfile>;
    const targetId = targetBody.data.id;

    // Promote admin candidate directly in the test DB.
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });

    // Participant login.
    const participantLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: targetEmail,
        password,
      })
      .expect(200);

    const participantToken = (
      participantLogin.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    // Participant must be rejected.
    await request(app.getHttpServer())
      .patch(`/api/admin/users/${targetId}/role`)
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ role: UserRole.ADMIN })
      .expect(403);

    // Admin login.
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: adminEmail,
        password,
      })
      .expect(200);

    const adminToken = (
      adminLogin.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    // Admin can promote the target user.
    await request(app.getHttpServer())
      .patch(`/api/admin/users/${targetId}/role`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: UserRole.CAMPUS_AMBASSADOR })
      .expect(200);

    const updatedUser = await prisma.user.findUnique({
      where: { id: targetId },
      select: { role: true },
    });

    expect(updatedUser?.role).toBe(UserRole.CAMPUS_AMBASSADOR);
  });
});

describe('CA onboarding RBAC (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('CA onboarding is restricted to CAMPUS_AMBASSADOR', async () => {
    const participantEmail = `${randomUUID()}@infinito.dev`;
    const caEmail = `${randomUUID()}@infinito.dev`;
    const password = 'a-strong-password';

    // No token -> 401.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .send({ college: 'IIT Patna' })
      .expect(401);

    // Create normal participant.
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: participantEmail,
        password,
        name: 'E2E Participant',
        consent: true,
      })
      .expect(201);

    // Login as participant.
    const participantLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: participantEmail,
        password,
      })
      .expect(200);

    const participantToken = (
      participantLogin.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    // Participant -> 403.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .set('Authorization', `Bearer ${participantToken}`)
      .send({ college: 'IIT Patna' })
      .expect(403);

    // Create CA user.
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: caEmail,
        password,
        name: 'E2E CA',
        consent: true,
      })
      .expect(201);

    // Promote directly in test DB.
    await prisma.user.update({
      where: { email: caEmail },
      data: { role: UserRole.CAMPUS_AMBASSADOR },
    });

    // Login as CA.
    const caLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: caEmail,
        password,
      })
      .expect(200);

    const caToken = (
      caLogin.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    // CAMPUS_AMBASSADOR -> allowed.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .set('Authorization', `Bearer ${caToken}`)
      .send({ college: 'IIT Patna' })
      .expect(201);
  });

  it('rejects invalid college values and normalizes valid college', async () => {
    const caEmail = `${randomUUID()}@infinito.dev`;
    const password = 'a-strong-password';

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: caEmail,
        password,
        name: 'E2E CA Edge Cases',
        consent: true,
      })
      .expect(201);

    await prisma.user.update({
      where: { email: caEmail },
      data: { role: UserRole.CAMPUS_AMBASSADOR },
    });

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: caEmail,
        password,
      })
      .expect(200);

    const token = (
      login.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    // Empty college -> 400.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ college: '' })
      .expect(400);

    // Whitespace-only college -> 400.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ college: '     ' })
      .expect(400);

    // More than 200 characters -> 400.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ college: 'A'.repeat(201) })
      .expect(400);

    // Extra whitespace -> accepted and normalized.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .set('Authorization', `Bearer ${token}`)
      .send({ college: '  IIT    Patna  ' })
      .expect(201);
  });

it('rejects invalid proof uploads', async () => {
  const caEmail = `${randomUUID()}@infinito.dev`;
  const password = 'a-strong-password';

  // Create CA user.
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email: caEmail,
      password,
      name: 'E2E Upload CA',
      consent: true,
    })
    .expect(201);

  await prisma.user.update({
    where: { email: caEmail },
    data: { role: UserRole.CAMPUS_AMBASSADOR },
  });

  // Login.
  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email: caEmail,
      password,
    })
    .expect(200);

  const token = (
    login.body as SuccessResponse<{
      accessToken: string;
      user: UserProfile;
    }>
  ).data.accessToken;

  // Create CA profile.
  await request(app.getHttpServer())
    .post('/api/ca/onboard')
    .set('Authorization', `Bearer ${token}`)
    .send({ college: 'IIT Patna' })
    .expect(201);

  // Create a task directly in the test DB.
  const task = await prisma.caTask.create({
    data: {
      title: 'E2E Upload Test Task',
      description: 'Task used for upload validation tests',
      category: 'SOCIAL_MEDIA',
      source: 'MODERATOR',
      points: 10,
      proofType: 'SCREENSHOT',
    },
  });

  // 1. Bad MIME type -> 400.
  await request(app.getHttpServer())
    .post(`/api/ca/tasks/${task.id}/submit`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from('this is not an image'), {
      filename: 'proof.txt',
      contentType: 'text/plain',
    })
    .expect(400);

  // 2. Oversized file (> 5 MB) -> 400.
  await request(app.getHttpServer())
    .post(`/api/ca/tasks/${task.id}/submit`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.alloc(5 * 1024 * 1024 + 1), {
      filename: 'large.jpg',
      contentType: 'image/jpeg',
    })
    .expect(413);

  // 3. Renamed executable -> 400.
  await request(app.getHttpServer())
    .post(`/api/ca/tasks/${task.id}/submit`)
    .set('Authorization', `Bearer ${token}`)
    .attach('file', Buffer.from('fake executable content'), {
      filename: 'malware.jpg',
      contentType: 'image/jpeg',
    })
    .expect(400);
});

it('rejects unsafe proof URL schemes', async () => {
  const caEmail = `${randomUUID()}@infinito.dev`;
  const password = 'a-strong-password';

  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email: caEmail,
      password,
      name: 'E2E URL CA',
      consent: true,
    })
    .expect(201);

  await prisma.user.update({
    where: { email: caEmail },
    data: { role: UserRole.CAMPUS_AMBASSADOR },
  });

  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({
      email: caEmail,
      password,
    })
    .expect(200);

  const token = (
    login.body as SuccessResponse<{
      accessToken: string;
      user: UserProfile;
    }>
  ).data.accessToken;

  await request(app.getHttpServer())
    .post('/api/ca/onboard')
    .set('Authorization', `Bearer ${token}`)
    .send({ college: 'IIT Patna' })
    .expect(201);

  const task = await prisma.caTask.create({
    data: {
      title: 'E2E URL Test Task',
      description: 'Task used for URL validation',
      category: 'SOCIAL_MEDIA',
      source: 'MODERATOR',
      points: 10,
      proofType: 'URL_SUBMISSION',
    },
  });

  // javascript: -> 400
  await request(app.getHttpServer())
    .post(`/api/ca/tasks/${task.id}/submit`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      proofUrl: 'javascript:alert(1)',
    })
    .expect(400);

  // data: -> 400
  await request(app.getHttpServer())
    .post(`/api/ca/tasks/${task.id}/submit`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      proofUrl: 'data:text/html,<script>alert(1)</script>',
    })
    .expect(400);

  // Valid https URL -> accepted
  await request(app.getHttpServer())
    .post(`/api/ca/tasks/${task.id}/submit`)
    .set('Authorization', `Bearer ${token}`)
    .send({
      proofUrl: 'https://example.com/proof',
    })
    .expect(201);
});

});

describe('Admin CA assignment listing (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('enforces RBAC and supports pagination/status filter', async () => {
    const adminEmail = `${randomUUID()}@infinito.dev`;
    const caEmail = `${randomUUID()}@infinito.dev`;
    const participantEmail = `${randomUUID()}@infinito.dev`;
    const password = 'a-strong-password';

    // Create users.
    for (const [email, name] of [
      [adminEmail, 'E2E Admin'],
      [caEmail, 'E2E CA'],
      [participantEmail, 'E2E Participant'],
    ] as const) {
      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email,
          password,
          name,
          consent: true,
        })
        .expect(201);
    }

    // Promote admin and CA.
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: UserRole.ADMIN },
    });

    await prisma.user.update({
      where: { email: caEmail },
      data: { role: UserRole.CAMPUS_AMBASSADOR },
    });

    // Login users.
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: adminEmail, password })
      .expect(200);

    const adminToken = (
      adminLogin.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    const caLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: caEmail, password })
      .expect(200);

    const caToken = (
      caLogin.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    const participantLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: participantEmail, password })
      .expect(200);

    const participantToken = (
      participantLogin.body as SuccessResponse<{
        accessToken: string;
        user: UserProfile;
      }>
    ).data.accessToken;

    // Create CA profile directly through onboarding.
    await request(app.getHttpServer())
      .post('/api/ca/onboard')
      .set('Authorization', `Bearer ${caToken}`)
      .send({ college: 'IIT Patna' })
      .expect(201);

    const ca = await prisma.cAProfile.findUniqueOrThrow({
      where: {
        userId: (
          await prisma.user.findUniqueOrThrow({
            where: { email: caEmail },
          })
        ).id,
      },
    });

    // Create task.
    const task = await prisma.caTask.create({
      data: {
        title: 'E2E Assignment Listing Task',
        description: 'Task for assignment listing tests',
        category: 'SOCIAL_MEDIA',
        source: 'MODERATOR',
        points: 10,
        proofType: 'SCREENSHOT',
      },
    });

    // Create 3 assignments with different statuses.
// Create two additional CA users so the same task
// can have multiple assignments.
const ca2Email = `${randomUUID()}@infinito.dev`;
const ca3Email = `${randomUUID()}@infinito.dev`;

for (const [email, name] of [
  [ca2Email, 'E2E CA 2'],
  [ca3Email, 'E2E CA 3'],
] as const) {
  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({
      email,
      password,
      name,
      consent: true,
    })
    .expect(201);
}

const ca2User = await prisma.user.update({
  where: { email: ca2Email },
  data: { role: UserRole.CAMPUS_AMBASSADOR },
});

const ca3User = await prisma.user.update({
  where: { email: ca3Email },
  data: { role: UserRole.CAMPUS_AMBASSADOR },
});

const ca2 = await prisma.cAProfile.create({
  data: {
    userId: ca2User.id,
    refCode: `CA-E2E-${randomUUID().slice(0, 8)}`,
    assignedCollegeName: 'IIT Delhi',
  },
});

const ca3 = await prisma.cAProfile.create({
  data: {
    userId: ca3User.id,
    refCode: `CA-E2E-${randomUUID().slice(0, 8)}`,
    assignedCollegeName: 'IIT Bombay',
  },
});

// Create 3 assignments for the same task,
// each belonging to a different CA.
    await prisma.cATaskAssignment.createMany({
      data: [
        {
          caId: ca.id,
          taskId: task.id,
          status: 'PENDING',
        },
        {
          caId: ca2.id,
          taskId: task.id,
          status: 'SUBMITTED',
        },
        {
          caId: ca3.id,
          taskId: task.id,
          status: 'VERIFIED',
        },
      ],
    });

    // Participant -> 403.
    await request(app.getHttpServer())
      .get(`/api/admin/ca-tasks/${task.id}/assignments`)
      .set('Authorization', `Bearer ${participantToken}`)
      .expect(403);

    // CA -> 403.
    await request(app.getHttpServer())
      .get(`/api/admin/ca-tasks/${task.id}/assignments`)
      .set('Authorization', `Bearer ${caToken}`)
      .expect(403);

    // Admin -> 200 + pagination.
    const response = await request(app.getHttpServer())
      .get(`/api/admin/ca-tasks/${task.id}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        page: 1,
        limit: 2,
      })
      .expect(200);

      expect(response.body.data.task.id).toBe(task.id);
      expect(response.body.data.assignments).toHaveLength(2);

      expect(response.body.data.pagination).toEqual(
        expect.objectContaining({
          page: 1,
          limit: 2,
          total: 3,
          totalPages: 2,
        }),
      );
          const page2 = await request(app.getHttpServer())
      .get(`/api/admin/ca-tasks/${task.id}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        page: 2,
        limit: 2,
      })
      .expect(200);

    expect(page2.body.data.assignments).toHaveLength(1);

    expect(page2.body.data.pagination).toEqual(
      expect.objectContaining({
        page: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      }),
    );

    // Status filter.
    const filtered = await request(app.getHttpServer())
      .get(`/api/admin/ca-tasks/${task.id}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        status: 'PENDING',
      })
      .expect(200);

    expect(filtered.body.data.assignments).toHaveLength(1);
    expect(filtered.body.data.assignments[0].status).toBe('PENDING');
    // Invalid status -> 400.
    await request(app.getHttpServer())
      .get(`/api/admin/ca-tasks/${task.id}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        status: 'INVALID_STATUS',
      })
      .expect(400);

    // Limit is capped at 100.
    const capped = await request(app.getHttpServer())
      .get(`/api/admin/ca-tasks/${task.id}/assignments`)
      .set('Authorization', `Bearer ${adminToken}`)
      .query({
        limit: 999,
      })
      .expect(200);

    expect(capped.body.data.pagination.limit).toBe(100);
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