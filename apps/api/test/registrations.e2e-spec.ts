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
  IdentityType,
  ParticipantRole,
  SubOptionType,
  Prisma,
} from '@prisma/client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import type { SuccessResponse } from './../src/common/envelope/envelope.types';
import type { UserProfile } from './../src/auth/auth.service';

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

// The global ThrottlerGuard caps /auth/register + /auth/login at 10 req/60s
// per process (in-memory ThrottlerStorage), same as auth.e2e-spec.ts. Each
// describe block below gets its own app instance (and thus its own throttle
// bucket) and stays well under that budget.
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

function baseEventData(
  overrides: Partial<Prisma.EventCreateInput> &
    Pick<
      Prisma.EventCreateInput,
      'slug' | 'name' | 'registrationType' | 'feeStructure'
    >,
): Prisma.EventCreateInput {
  return {
    broadCategory: BroadCategory.OUTDOOR,
    sportCategory: 'Test Sport',
    genderCategory: GenderCategory.OPEN,
    viceCaptainRequired: false,
    coachAllowed: false,
    startDate: new Date('2026-09-15T08:00:00Z'),
    isPublished: true,
    registrationOpen: true,
    ...overrides,
  };
}

async function createTeamWithRoster(
  prisma: PrismaService,
  captainId: string,
  eventId: string,
  rosterSize: number,
  overrides: { isIITP?: boolean; declaredSize?: number } = {},
) {
  const team = await prisma.team.create({
    data: {
      eventId,
      // Registration eligibility/fees key off declaredSize, not the actual
      // Participant rows created below — defaults to rosterSize so existing
      // callers (which want both in sync) don't need to change.
      declaredSize: overrides.declaredSize ?? rosterSize,
      name: `E2E Team ${randomUUID().slice(0, 8)}`,
      captainId,
      collegeName: 'E2E College',
      isIITP: overrides.isIITP ?? false,
      inviteCode: `E2E-${randomUUID().slice(0, 8).toUpperCase()}`,
    },
  });

  for (let i = 0; i < rosterSize; i++) {
    await prisma.participant.create({
      data: {
        teamId: team.id,
        name: `Player ${i + 1}`,
        role: i === 0 ? ParticipantRole.CAPTAIN : ParticipantRole.PLAYER,
        isRequired: true,
        userId: i === 0 ? captainId : null,
        photoUrl: 'https://placeholder.infinito2k26.in/e2e.jpg',
        idType: IdentityType.COLLEGE_ID,
        idNumber: `E2E-${team.id}-${i}`,
        idFileUrl: 'https://placeholder.infinito2k26.in/e2e.pdf',
      },
    });
  }

  return team;
}

describe('Registrations: validation and errors (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated requests with 401', async () => {
    await request(app.getHttpServer())
      .post('/api/registrations')
      .send({ eventId: randomUUID() })
      .expect(401);
  });

  it('rejects unknown fields (whitelist) with 400', async () => {
    const user = await registerAndLogin(app, 'E2E Whitelist');

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: randomUUID(), notAField: 'x' })
      .expect(400);
  });

  it('returns 404 for a non-existent event', async () => {
    const user = await registerAndLogin(app, 'E2E Not Found');

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: randomUUID() })
      .expect(404);
  });

  it('individual registration: rejects a teamId with 400', async () => {
    const user = await registerAndLogin(app, 'E2E Individual Reject Team');
    const prisma = app.get(PrismaService);

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Individual Reject Team Event',
        slug: `e2e-individual-reject-team-${randomUUID()}`,
        registrationType: EventRegistrationType.INDIVIDUAL,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 100,
      }),
    });

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id, teamId: randomUUID() })
      .expect(400);
  });
});

describe('Registrations: individual flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('individual registration: happy path computes the FLAT fee and returns PENDING_PAYMENT', async () => {
    const user = await registerAndLogin(app, 'E2E Individual Happy');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Individual Event',
        slug: `e2e-individual-${randomUUID()}`,
        registrationType: EventRegistrationType.INDIVIDUAL,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 599,
      }),
    });

    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id })
      .expect(201);

    const body = (res.body as SuccessResponse<RegistrationResponseData>).data;
    expect(body.eventId).toBe(event.id);
    expect(body.status).toBe('PENDING_PAYMENT');
    expect(Number(body.payment.amount)).toBe(599);
    expect(body.payment.mode).toBe('MANUAL_SCREENSHOT');
    expect(body.payment.status).toBe('INITIATED');

    const stored = await prisma.registration.findUniqueOrThrow({
      where: { id: body.id },
    });
    expect(stored.userId).toBe(user.userId);
    expect(stored.teamId).toBeNull();
  });

  it('individual registration: duplicate registration returns 409', async () => {
    const user = await registerAndLogin(app, 'E2E Individual Dup');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Individual Dup Event',
        slug: `e2e-individual-dup-${randomUUID()}`,
        registrationType: EventRegistrationType.INDIVIDUAL,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 100,
      }),
    });

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id })
      .expect(409);
  });

  it('rejects registration when the event is not open (422)', async () => {
    const user = await registerAndLogin(app, 'E2E Not Open');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Not Open Event',
        slug: `e2e-not-open-${randomUUID()}`,
        registrationType: EventRegistrationType.INDIVIDUAL,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 100,
        registrationOpen: false,
      }),
    });

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id })
      .expect(422);
  });
});

describe('Registrations: capacity and gender-based fees (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects registration once capacity is reached (422)', async () => {
    const first = await registerAndLogin(app, 'E2E Capacity One');
    const second = await registerAndLogin(app, 'E2E Capacity Two');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Capacity Event',
        slug: `e2e-capacity-${randomUUID()}`,
        registrationType: EventRegistrationType.INDIVIDUAL,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 100,
        capacity: 1,
      }),
    });

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${first.token}`)
      .send({ eventId: event.id })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${second.token}`)
      .send({ eventId: event.id })
      .expect(422);
  });

  it('GENDER_BASED events require genderDeclared (422) and price by gender', async () => {
    const user = await registerAndLogin(app, 'E2E Gender Based');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Gender Based Event',
        slug: `e2e-gender-based-${randomUUID()}`,
        registrationType: EventRegistrationType.TEAM,
        feeStructure: FeeStructure.GENDER_BASED,
        feeMale: 6500,
        feeFemale: 3000,
        teamSizeMin: 3,
        teamSizeMax: 5,
      }),
    });

    const team = await createTeamWithRoster(prisma, user.userId, event.id, 3);

    // Missing genderDeclared -> 422.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id, teamId: team.id })
      .expect(422);

    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id, teamId: team.id, genderDeclared: 'WOMEN' })
      .expect(201);

    const body = (res.body as SuccessResponse<RegistrationResponseData>).data;
    expect(Number(body.payment.amount)).toBe(3000);
  });
});

describe('Registrations: team flow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('team registration: happy path, only the captain may register, declared size is enforced', async () => {
    const captain = await registerAndLogin(app, 'E2E Team Captain');
    const notCaptain = await registerAndLogin(app, 'E2E Not Captain');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Team Event',
        slug: `e2e-team-${randomUUID()}`,
        registrationType: EventRegistrationType.TEAM,
        feeStructure: FeeStructure.PER_HEAD,
        feePerHead: 249,
        teamSizeMin: 4,
        teamSizeMax: 6,
      }),
    });

    // No teamId -> 400.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${captain.token}`)
      .send({ eventId: event.id })
      .expect(400);

    // Declared size below teamSizeMin -> 422.
    const smallTeam = await createTeamWithRoster(
      prisma,
      captain.userId,
      event.id,
      2,
    );
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${captain.token}`)
      .send({ eventId: event.id, teamId: smallTeam.id })
      .expect(422);

    const team = await createTeamWithRoster(
      prisma,
      captain.userId,
      event.id,
      4,
    );

    // Not the captain -> 403.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${notCaptain.token}`)
      .send({ eventId: event.id, teamId: team.id })
      .expect(403);

    // Captain -> 201, PER_HEAD fee = 249 x 4.
    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${captain.token}`)
      .send({ eventId: event.id, teamId: team.id })
      .expect(201);

    const body = (res.body as SuccessResponse<RegistrationResponseData>).data;
    expect(Number(body.payment.amount)).toBe(249 * 4);

    // Registering the same team again -> 409.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${captain.token}`)
      .send({ eventId: event.id, teamId: team.id })
      .expect(409);
  });

  it('IITP teams register for free regardless of fee structure', async () => {
    const captain = await registerAndLogin(app, 'E2E IITP Captain');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E IITP Event',
        slug: `e2e-iitp-${randomUUID()}`,
        registrationType: EventRegistrationType.TEAM,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 6500,
        teamSizeMin: 3,
        teamSizeMax: 5,
      }),
    });

    const team = await createTeamWithRoster(
      prisma,
      captain.userId,
      event.id,
      3,
      { isIITP: true },
    );

    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${captain.token}`)
      .send({ eventId: event.id, teamId: team.id })
      .expect(201);

    const body = (res.body as SuccessResponse<RegistrationResponseData>).data;
    expect(Number(body.payment.amount)).toBe(0);
  });
});

describe('Registrations: custom fields and sub-options (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('validates customData against Event.customFieldsDef (TEAM scope)', async () => {
    const user = await registerAndLogin(app, 'E2E Custom Fields');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Custom Fields Event',
        slug: `e2e-custom-fields-${randomUUID()}`,
        registrationType: EventRegistrationType.INDIVIDUAL,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 599,
        customFieldsDef: [
          {
            label: 'Roll No.',
            inputType: 'TEXT',
            required: true,
            scope: 'TEAM',
          },
          {
            label: 'College ID',
            inputType: 'TEXT',
            required: true,
            scope: 'TEAM',
          },
        ],
      }),
    });

    // Missing required field -> 400.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ eventId: event.id, customData: { 'Roll No.': 'A1' } })
      .expect(400);

    // Unknown field -> 400.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        eventId: event.id,
        customData: { 'Roll No.': 'A1', 'College ID': 'C1', extra: 'x' },
      })
      .expect(400);

    // Valid -> 201.
    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        eventId: event.id,
        customData: { 'Roll No.': 'A1', 'College ID': 'C1' },
      })
      .expect(201);

    const body = (res.body as SuccessResponse<RegistrationResponseData>).data;
    const stored = await prisma.registration.findUniqueOrThrow({
      where: { id: body.id },
    });
    expect(stored.customData).toEqual({
      'Roll No.': 'A1',
      'College ID': 'C1',
    });
  });

  it('validates subOptionSelections: unknown sub-option, missing relayMembers, and the shared per-type cap', async () => {
    const user = await registerAndLogin(app, 'E2E Sub Options');

    const event = await prisma.event.create({
      data: baseEventData({
        name: 'E2E Athletics Event',
        slug: `e2e-athletics-${randomUUID()}`,
        registrationType: EventRegistrationType.INDIVIDUAL,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 700,
      }),
    });

    const individualSubOptions = await Promise.all(
      ['100m', '200m', '400m', '800m'].map((name) =>
        prisma.eventSubOption.create({
          data: {
            eventId: event.id,
            name,
            type: SubOptionType.INDIVIDUAL,
            maxSelectionsPerReg: 3,
            isActive: true,
          },
        }),
      ),
    );

    const relay = await prisma.eventSubOption.create({
      data: {
        eventId: event.id,
        name: '4x100m Relay',
        type: SubOptionType.RELAY,
        maxSelectionsPerReg: 2,
        isActive: true,
      },
    });

    const otherEventSubOption = await prisma.eventSubOption.create({
      data: {
        eventId: (
          await prisma.event.create({
            data: baseEventData({
              name: 'E2E Foreign Event',
              slug: `e2e-foreign-${randomUUID()}`,
              registrationType: EventRegistrationType.INDIVIDUAL,
              feeStructure: FeeStructure.FLAT,
              feeFlat: 1,
            }),
          })
        ).id,
        name: 'Foreign Discipline',
        type: SubOptionType.INDIVIDUAL,
        maxSelectionsPerReg: 3,
        isActive: true,
      },
    });

    // Sub-option belonging to a different event -> 400.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        eventId: event.id,
        subOptionSelections: [{ subOptionId: otherEventSubOption.id }],
      })
      .expect(400);

    // Relay selection without relayMembers -> 400.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        eventId: event.id,
        subOptionSelections: [{ subOptionId: relay.id }],
      })
      .expect(400);

    // Exceeds the individual-type cap (3) -> 422.
    await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        eventId: event.id,
        subOptionSelections: individualSubOptions.map((s) => ({
          subOptionId: s.id,
        })),
      })
      .expect(422);

    // Within caps -> 201, and RegistrationSubOption rows are persisted.
    const res = await request(app.getHttpServer())
      .post('/api/registrations')
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        eventId: event.id,
        subOptionSelections: [
          { subOptionId: individualSubOptions[0].id },
          { subOptionId: individualSubOptions[1].id },
          { subOptionId: relay.id, relayMembers: ['Runner A', 'Runner B'] },
        ],
      })
      .expect(201);

    const body = (res.body as SuccessResponse<RegistrationResponseData>).data;
    const subOptionRows = await prisma.registrationSubOption.findMany({
      where: { registrationId: body.id },
    });
    expect(subOptionRows).toHaveLength(3);
  });
});
