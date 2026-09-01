import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import {
  BroadCategory,
  EventRegistrationType,
  FeeStructure,
  GenderCategory,
  ScanDirection,
  UserRole,
} from '@prisma/client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { UploadsService } from './../src/uploads/uploads.service';
import { IdentityService } from './../src/identity/identity.service';
import { TokenService } from './../src/identity/token.service';
import type { SuccessResponse } from './../src/common/envelope/envelope.types';
import type { UserProfile } from './../src/auth/auth.service';

// Real Cloudinary calls are out of scope for this suite — swap in a fake
// that behaves like the real thing (returns a key on upload, builds a
// deterministic URL string) without making a network call.
class FakeUploadsService {
  uploadProof(_buffer: Buffer, _mimeType: string, folder: string) {
    return Promise.resolve({ key: `${folder}/${randomUUID()}` });
  }

  getSignedGetUrl(key: string): string {
    return `https://fake-cdn.test/${key}`;
  }
}

async function createApp(): Promise<INestApplication<App>> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(UploadsService)
    .useClass(FakeUploadsService)
    .compile();

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

// Same throttle-bucket reasoning as registrations.e2e-spec.ts: each describe
// block gets its own app instance, so its own ThrottlerGuard bucket.
async function registerAndLogin(app: INestApplication<App>, name: string) {
  const email = `${randomUUID()}@infinito.dev`;
  const password = 'a-strong-password';

  const registerRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name, consent: true })
    .expect(201);

  const userId = (registerRes.body as SuccessResponse<UserProfile>).data.id;

  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const token = (
    login.body as SuccessResponse<{ accessToken: string; user: UserProfile }>
  ).data.accessToken;

  return { email, token, userId };
}

// Role is baked into the JWT at login time (see jwt.strategy.ts), so the
// role must be promoted in the DB *before* login, not after.
async function registerLoginWithRole(
  app: INestApplication<App>,
  prisma: PrismaService,
  name: string,
  role: UserRole,
) {
  const email = `${randomUUID()}@infinito.dev`;
  const password = 'a-strong-password';

  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name, consent: true })
    .expect(201);

  await prisma.user.update({ where: { email }, data: { role } });

  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const token = (
    login.body as SuccessResponse<{ accessToken: string; user: UserProfile }>
  ).data.accessToken;

  return { email, token };
}

async function createRegistration(prisma: PrismaService, userId: string) {
  const event = await prisma.event.create({
    data: {
      name: `E2E Identity Event ${randomUUID().slice(0, 8)}`,
      slug: `e2e-identity-${randomUUID()}`,
      broadCategory: BroadCategory.OUTDOOR,
      sportCategory: 'Test Sport',
      genderCategory: GenderCategory.OPEN,
      registrationType: EventRegistrationType.INDIVIDUAL,
      feeStructure: FeeStructure.FLAT,
      feeFlat: 100,
      viceCaptainRequired: false,
      coachAllowed: false,
      startDate: new Date('2026-09-15T08:00:00Z'),
      isPublished: true,
      registrationOpen: true,
    },
  });

  return prisma.registration.create({
    data: { eventId: event.id, userId },
  });
}

describe('Identity: credential issuance + GET /identity/mine (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let identityService: IdentityService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    identityService = app.get(IdentityService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer()).get('/api/identity/mine').expect(401);
  });

  it('returns 404 when no credential has been issued yet', async () => {
    const user = await registerAndLogin(app, 'E2E No Credential');

    await request(app.getHttpServer())
      .get('/api/identity/mine')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(404);
  });

  it('a confirmed registration produces exactly one Credential row (critical test #7), fetchable via GET /identity/mine', async () => {
    const user = await registerAndLogin(app, 'E2E Credential Issued');
    const registration = await createRegistration(prisma, user.userId);

    await identityService.issueCredentialsForPayment(registration.id);

    // Idempotency: re-running the trigger (e.g. a retried job) must not
    // create a second credential for the same user.
    await identityService.issueCredentialsForPayment(registration.id);

    const rows = await prisma.credential.findMany({
      where: { userId: user.userId },
    });
    expect(rows).toHaveLength(1);

    const res = await request(app.getHttpServer())
      .get('/api/identity/mine')
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    const body = (
      res.body as SuccessResponse<{
        id: string;
        scanCount: number;
        lastScannedAt: string | null;
        qrImageUrl: string;
      }>
    ).data;
    expect(body.id).toBe(rows[0].id);
    expect(body.scanCount).toBe(0);
    expect(body.lastScannedAt).toBeNull();
    expect(body.qrImageUrl).toContain('fake-cdn.test');
  });
});

describe('Identity: GET /identity/scan/:token (gate dashboard, e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let identityService: IdentityService;
  let tokenService: TokenService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    identityService = app.get(IdentityService);
    tokenService = app.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('allows unauthenticated requests — the scan dashboard is public (only logging a scan requires a volunteer/admin login)', async () => {
    // Garbage signature, no Authorization header: previously 401'd before the
    // signature was even checked. Now it reaches signature validation directly.
    await request(app.getHttpServer())
      .get(`/api/identity/scan/${randomUUID()}.not-a-real-signature`)
      .expect(400);
  });

  it('a PARTICIPANT caller can view the dashboard too — viewing has no role gate', async () => {
    const user = await registerAndLogin(app, 'E2E Scan Dashboard Participant');
    const registration = await createRegistration(prisma, user.userId);
    await identityService.issueCredentialsForPayment(registration.id);
    const credential = await prisma.credential.findUniqueOrThrow({
      where: { userId: user.userId },
    });
    const rawToken = tokenService.signToken(credential.id);

    const res = await request(app.getHttpServer())
      .get(`/api/identity/scan/${encodeURIComponent(rawToken)}`)
      .set('Authorization', `Bearer ${user.token}`)
      .expect(200);

    expect(
      (res.body as SuccessResponse<{ credentialId: string }>).data.credentialId,
    ).toBe(credential.id);
  });

  it('rejects a tampered token with 400 (critical test #9)', async () => {
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Scan Dashboard Tampered',
      UserRole.VOLUNTEER,
    );

    await request(app.getHttpServer())
      .get(`/api/identity/scan/${randomUUID()}.not-a-real-signature`)
      .set('Authorization', `Bearer ${volunteer.token}`)
      .expect(400);
  });

  it('returns 404 for a structurally valid but unknown/revoked credential', async () => {
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Scan Dashboard Unknown',
      UserRole.VOLUNTEER,
    );
    const rawToken = tokenService.signToken(randomUUID());

    await request(app.getHttpServer())
      .get(`/api/identity/scan/${encodeURIComponent(rawToken)}`)
      .set('Authorization', `Bearer ${volunteer.token}`)
      .expect(404);
  });

  it('returns the full holder dashboard for a real, correctly signed token', async () => {
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Scan Dashboard Volunteer',
      UserRole.VOLUNTEER,
    );
    const user = await registerAndLogin(app, 'E2E Scan Dashboard Holder');
    const registration = await createRegistration(prisma, user.userId);
    await identityService.issueCredentialsForPayment(registration.id);

    const credential = await prisma.credential.findUniqueOrThrow({
      where: { userId: user.userId },
    });
    const rawToken = tokenService.signToken(credential.id);

    const res = await request(app.getHttpServer())
      .get(`/api/identity/scan/${encodeURIComponent(rawToken)}`)
      .set('Authorization', `Bearer ${volunteer.token}`)
      .expect(200);

    const body = (
      res.body as SuccessResponse<{
        credentialId: string;
        holder: { name: string; photoUrl: string | null };
        event: { name: string };
        scanCount: number;
      }>
    ).data;
    expect(body.credentialId).toBe(credential.id);
    expect(body.holder.name).toBe('E2E Scan Dashboard Holder');
    expect(body.holder.photoUrl).toBeNull();
    expect(body.scanCount).toBe(0);
  });
});

describe('Identity: POST /identity/scan (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let identityService: IdentityService;
  let tokenService: TokenService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    identityService = app.get(IdentityService);
    tokenService = app.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/identity/scan')
      .send({ token: 'x', gate: 'Gate 1', direction: ScanDirection.ENTRY })
      .expect(401);
  });

  it('rejects a PARTICIPANT caller with 403 (volunteer/admin only)', async () => {
    const user = await registerAndLogin(app, 'E2E Scan Forbidden');

    await request(app.getHttpServer())
      .post('/api/identity/scan')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ token: 'x', gate: 'Gate 1', direction: ScanDirection.ENTRY })
      .expect(403);
  });

  it('rejects a tampered token with 400 before any ScanLog write (critical test #9)', async () => {
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Scan Volunteer Tampered',
      UserRole.VOLUNTEER,
    );
    const holder = await registerAndLogin(app, 'E2E Scan Tampered Holder');
    const registration = await createRegistration(prisma, holder.userId);
    await identityService.issueCredentialsForPayment(registration.id);
    const credential = await prisma.credential.findUniqueOrThrow({
      where: { userId: holder.userId },
    });
    const validToken = tokenService.signToken(credential.id);
    const tamperedToken = `${validToken}tampered`;

    await request(app.getHttpServer())
      .post('/api/identity/scan')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ token: tamperedToken, gate: 'Gate 1', direction: 'ENTRY' })
      .expect(400);

    const logs = await prisma.scanLog.findMany({
      where: { credentialId: credential.id },
    });
    expect(logs).toHaveLength(0);
  });

  it('returns 404 for a structurally valid token with no matching credential', async () => {
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Scan Volunteer Unknown',
      UserRole.VOLUNTEER,
    );
    const rawToken = tokenService.signToken(randomUUID());

    await request(app.getHttpServer())
      .post('/api/identity/scan')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ token: rawToken, gate: 'Gate 1', direction: 'ENTRY' })
      .expect(404);
  });

  it('a valid scan writes exactly one ScanLog and increments scanCount (critical test #8); a repeat same-direction scan is DUPLICATE and does not increment', async () => {
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Scan Volunteer Valid',
      UserRole.VOLUNTEER,
    );
    const holder = await registerAndLogin(app, 'E2E Scan Valid Holder');
    const registration = await createRegistration(prisma, holder.userId);
    await identityService.issueCredentialsForPayment(registration.id);
    const credential = await prisma.credential.findUniqueOrThrow({
      where: { userId: holder.userId },
    });
    const rawToken = tokenService.signToken(credential.id);

    const first = await request(app.getHttpServer())
      .post('/api/identity/scan')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ token: rawToken, gate: 'Gate 1', direction: 'ENTRY' })
      .expect(201);

    expect(
      (first.body as SuccessResponse<{ result: string }>).data.result,
    ).toBe('VALID');

    let updated = await prisma.credential.findUniqueOrThrow({
      where: { id: credential.id },
    });
    expect(updated.scanCount).toBe(1);
    expect(updated.lastScannedAt).not.toBeNull();

    // Same direction again with no EXIT in between -> DUPLICATE, no increment.
    const second = await request(app.getHttpServer())
      .post('/api/identity/scan')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ token: rawToken, gate: 'Gate 1', direction: 'ENTRY' })
      .expect(201);

    expect(
      (second.body as SuccessResponse<{ result: string }>).data.result,
    ).toBe('DUPLICATE');

    updated = await prisma.credential.findUniqueOrThrow({
      where: { id: credential.id },
    });
    expect(updated.scanCount).toBe(1);

    // Opposite direction -> VALID again, increments.
    const third = await request(app.getHttpServer())
      .post('/api/identity/scan')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ token: rawToken, gate: 'Gate 1', direction: 'EXIT' })
      .expect(201);

    expect(
      (third.body as SuccessResponse<{ result: string }>).data.result,
    ).toBe('VALID');

    const logs = await prisma.scanLog.findMany({
      where: { credentialId: credential.id },
      orderBy: { createdAt: 'asc' },
    });
    expect(logs).toHaveLength(3);

    updated = await prisma.credential.findUniqueOrThrow({
      where: { id: credential.id },
    });
    expect(updated.scanCount).toBe(2);
  });
});

describe('Identity: GET /admin/scans (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let identityService: IdentityService;
  let tokenService: TokenService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
    identityService = app.get(IdentityService);
    tokenService = app.get(TokenService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer()).get('/api/admin/scans').expect(401);
  });

  it('rejects a VOLUNTEER caller with 403 (admin only)', async () => {
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Admin Scans Forbidden',
      UserRole.VOLUNTEER,
    );

    await request(app.getHttpServer())
      .get('/api/admin/scans')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .expect(403);
  });

  it('lists scans with pagination, resolved holderName, and gate filtering', async () => {
    const admin = await registerLoginWithRole(
      app,
      prisma,
      'E2E Admin Scans Viewer',
      UserRole.ADMIN,
    );
    const volunteer = await registerLoginWithRole(
      app,
      prisma,
      'E2E Admin Scans Scanner',
      UserRole.VOLUNTEER,
    );
    const holder = await registerAndLogin(app, 'E2E Admin Scans Holder');
    const registration = await createRegistration(prisma, holder.userId);
    await identityService.issueCredentialsForPayment(registration.id);
    const credential = await prisma.credential.findUniqueOrThrow({
      where: { userId: holder.userId },
    });
    const rawToken = tokenService.signToken(credential.id);
    const gate = `E2E Gate ${randomUUID().slice(0, 8)}`;

    await request(app.getHttpServer())
      .post('/api/identity/scan')
      .set('Authorization', `Bearer ${volunteer.token}`)
      .send({ token: rawToken, gate, direction: 'ENTRY' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get('/api/admin/scans')
      .query({ gate, page: 1, limit: 20 })
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const body = (
      res.body as SuccessResponse<{
        scans: Array<{
          gate: string;
          holderName: string | null;
          scannedBy: { name: string };
        }>;
        pagination: { page: number; limit: number; total: number };
      }>
    ).data;

    expect(body.scans).toHaveLength(1);
    expect(body.scans[0].gate).toBe(gate);
    expect(body.scans[0].holderName).toBe('E2E Admin Scans Holder');
    expect(body.scans[0].scannedBy.name).toBe('E2E Admin Scans Scanner');
    expect(body.pagination.total).toBe(1);
  });
});
