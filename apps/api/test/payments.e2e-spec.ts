import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { UserRole, BroadCategory, GenderCategory } from '@prisma/client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import type { SuccessResponse } from './../src/common/envelope/envelope.types';
import type { UserProfile } from './../src/auth/auth.service';

// A real (if tiny) 4x4 PNG — FileTypeValidator sniffs actual magic bytes,
// same fixture used by merch.e2e-spec.ts and identity.e2e-spec.ts.
const FAKE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGP4z8AARwzEcQCukw/x0F8jngAAAABJRU5ErkJggg==',
  'base64',
);

type RegistrationResponseData = {
  id: string;
  eventId: string;
  status: string;
  payment: {
    id: string;
    amount: string | number;
    mode: string;
    status: string;
  };
};

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

async function registerLoginWithRole(
  app: INestApplication<App>,
  prisma: PrismaService,
  name: string,
  role: UserRole,
) {
  const email = `${randomUUID()}@infinito.dev`;
  const password = 'a-strong-password';

  const registerRes = await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name, consent: true })
    .expect(201);

  const userId = (registerRes.body as SuccessResponse<UserProfile>).data.id;

  await prisma.user.update({
    where: { email },
    data: { role, isEmailVerified: true, verificationExpiresAt: null },
  });

  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const token = (
    login.body as SuccessResponse<{ accessToken: string; user: UserProfile }>
  ).data.accessToken;

  return { email, token, userId };
}

function individualRegistrationRequest(
  app: INestApplication<App>,
  token: string,
  eventId: string,
) {
  return request(app.getHttpServer())
    .post('/api/registrations')
    .set('Authorization', `Bearer ${token}`)
    .field('eventId', eventId)
    .field('agreedToGuidelines', 'true')
    .field('idNumber', 'E2E-COLLEGE-ID')
    .field('secondaryIdType', 'AADHAR')
    .field('secondaryIdNumber', 'E2E-SECONDARY-ID')
    .field('customData', '{}')
    .field('subOptionSelections', '[]')
    .attach('photo', Buffer.from('e2e-photo'), {
      filename: 'photo.jpg',
      contentType: 'image/jpeg',
    })
    .attach('idFile', Buffer.from('e2e-college-id'), {
      filename: 'college-id.jpg',
      contentType: 'image/jpeg',
    })
    .attach('secondaryIdFile', Buffer.from('e2e-secondary-id'), {
      filename: 'secondary-id.jpg',
      contentType: 'image/jpeg',
    });
}

function submitPaymentRequest(
  app: INestApplication<App>,
  token: string,
  registrationId: string,
  utrNumber: string,
) {
  return request(app.getHttpServer())
    .post('/api/payments')
    .set('Authorization', `Bearer ${token}`)
    .field('registrationId', registrationId)
    .field('utrNumber', utrNumber)
    .field('idempotencyKey', randomUUID())
    .attach('file', FAKE_PNG, {
      filename: 'proof.png',
      contentType: 'image/png',
    });
}

describe('Payments: UTR submission, rejection, resubmission, verification (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('full lifecycle: submit with utrNumber -> reject -> resubmit -> verify -> registration CONFIRMED', async () => {
    const registrant = await registerLoginWithRole(
      app,
      prisma,
      'E2E Payment Registrant',
      UserRole.PARTICIPANT,
    );
    const admin = await registerLoginWithRole(
      app,
      prisma,
      'E2E Payment Admin',
      UserRole.ADMIN,
    );

    const event = await prisma.event.create({
      data: {
        name: 'E2E Payment Event',
        slug: `e2e-payment-${randomUUID()}`,
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Test Sport',
        genderCategory: GenderCategory.OPEN,
        registrationType: 'INDIVIDUAL',
        feeStructure: 'FLAT',
        feeFlat: 500,
        viceCaptainRequired: false,
        coachAllowed: false,
        startDate: new Date('2026-09-15T08:00:00Z'),
        isPublished: true,
        registrationOpen: true,
      },
    });

    const createRes = await individualRegistrationRequest(
      app,
      registrant.token,
      event.id,
    ).expect(201);
    const registration = (
      createRes.body as SuccessResponse<RegistrationResponseData>
    ).data;
    expect(registration.payment.status).toBe('INITIATED');

    // 1. Submit payment proof with a UTR number (not "transaction ID").
    const submitRes = await submitPaymentRequest(
      app,
      registrant.token,
      registration.id,
      'UTR-INITIAL-0001',
    ).expect(201);
    const paymentId = (submitRes.body as SuccessResponse<{ id: string }>).data
      .id;

    // Registrant now sees "paid, awaiting verification" via /registrations/mine.
    const mineAfterSubmit = await request(app.getHttpServer())
      .get('/api/registrations/mine')
      .set('Authorization', `Bearer ${registrant.token}`)
      .expect(200);
    const mineList = (
      mineAfterSubmit.body as SuccessResponse<
        Array<{
          id: string;
          status: string;
          payments: { status: string; rejectionReason: string | null }[];
        }>
      >
    ).data;
    const mineRow = mineList.find((r) => r.id === registration.id)!;
    expect(mineRow.status).toBe('PENDING_PAYMENT');
    expect(mineRow.payments[0].status).toBe('RECONCILIATION_PENDING');

    // 2. Admin rejects it.
    await request(app.getHttpServer())
      .patch(`/api/admin/payments/${paymentId}/verify`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'FAILED', rejectionReason: 'Amount mismatch' })
      .expect(200);

    const mineAfterReject = await request(app.getHttpServer())
      .get('/api/registrations/mine')
      .set('Authorization', `Bearer ${registrant.token}`)
      .expect(200);
    const rejectedRow = (
      mineAfterReject.body as SuccessResponse<
        Array<{
          id: string;
          status: string;
          payments: { status: string; rejectionReason: string | null }[];
        }>
      >
    ).data.find((r) => r.id === registration.id)!;
    expect(rejectedRow.status).toBe('PENDING_PAYMENT');
    expect(rejectedRow.payments[0].status).toBe('FAILED');
    expect(rejectedRow.payments[0].rejectionReason).toBe('Amount mismatch');

    // 3. Registrant resubmits — this is the fixed path: previously this 404'd
    // because the stub lookup only matched status INITIATED, not FAILED.
    const resubmitRes = await submitPaymentRequest(
      app,
      registrant.token,
      registration.id,
      'UTR-RESUBMIT-0002',
    ).expect(201);
    const resubmitBody = (
      resubmitRes.body as SuccessResponse<{
        id: string;
        status: string;
        utrNumber: string;
        rejectionReason: string | null;
      }>
    ).data;
    expect(resubmitBody.id).toBe(paymentId); // same row, reused
    expect(resubmitBody.status).toBe('RECONCILIATION_PENDING');
    expect(resubmitBody.utrNumber).toBe('UTR-RESUBMIT-0002');
    expect(resubmitBody.rejectionReason).toBeNull();

    // 4. Admin approves.
    await request(app.getHttpServer())
      .patch(`/api/admin/payments/${paymentId}/verify`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'SUCCESS' })
      .expect(200);

    // 5. Registrant now sees the registration as CONFIRMED (i.e. "Verified").
    const mineAfterVerify = await request(app.getHttpServer())
      .get('/api/registrations/mine')
      .set('Authorization', `Bearer ${registrant.token}`)
      .expect(200);
    const verifiedRow = (
      mineAfterVerify.body as SuccessResponse<
        Array<{ id: string; status: string; payments: { status: string }[] }>
      >
    ).data.find((r) => r.id === registration.id)!;
    expect(verifiedRow.status).toBe('CONFIRMED');
    expect(verifiedRow.payments[0].status).toBe('SUCCESS');
  });

  it('admin payments list exposes utrNumber (not transactionId)', async () => {
    const registrant = await registerLoginWithRole(
      app,
      prisma,
      'E2E Payment List Registrant',
      UserRole.PARTICIPANT,
    );
    const admin = await registerLoginWithRole(
      app,
      prisma,
      'E2E Payment List Admin',
      UserRole.ADMIN,
    );

    const event = await prisma.event.create({
      data: {
        name: 'E2E Payment List Event',
        slug: `e2e-payment-list-${randomUUID()}`,
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Test Sport',
        genderCategory: GenderCategory.OPEN,
        registrationType: 'INDIVIDUAL',
        feeStructure: 'FLAT',
        feeFlat: 250,
        viceCaptainRequired: false,
        coachAllowed: false,
        startDate: new Date('2026-09-15T08:00:00Z'),
        isPublished: true,
        registrationOpen: true,
      },
    });

    const createRes = await individualRegistrationRequest(
      app,
      registrant.token,
      event.id,
    ).expect(201);
    const registration = (
      createRes.body as SuccessResponse<RegistrationResponseData>
    ).data;

    await submitPaymentRequest(
      app,
      registrant.token,
      registration.id,
      'UTR-LIST-CHECK-0003',
    ).expect(201);

    const listRes = await request(app.getHttpServer())
      .get('/api/admin/payments?status=RECONCILIATION_PENDING')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    const payments = (
      listRes.body as SuccessResponse<{
        payments: Array<{
          registration: { id: string };
          utrNumber: string | null;
        }>;
      }>
    ).data.payments;
    const row = payments.find((p) => p.registration.id === registration.id);
    expect(row).toBeDefined();
    expect(row!.utrNumber).toBe('UTR-LIST-CHECK-0003');
    expect(row).not.toHaveProperty('transactionId');
  });
});
