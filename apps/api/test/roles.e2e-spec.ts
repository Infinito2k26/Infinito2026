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

const PASSWORD = 'a-strong-password';

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

describe('Roles & permissions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  // A single login (the JWT bakes `role` in at sign time, so a role promoted
  // after registration needs a fresh login to pick it up). Used for every
  // actor — including ones later promoted via `role`, to keep the shared
  // per-IP login-throttle bucket (10/min) well under budget across this file.
  async function registerAndLogin(name: string, role?: UserRole) {
    const email = `${randomUUID()}@infinito.dev`;

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: PASSWORD, name, consent: true })
      .expect(201);

    if (role) {
      await prisma.user.update({ where: { email }, data: { role } });
    }

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);

    const data = (
      login.body as SuccessResponse<{ accessToken: string; user: UserProfile }>
    ).data;

    return { email, token: data.accessToken, userId: data.user.id };
  }

  it('SUPER_ADMIN can CRUD a role; a plain PARTICIPANT is rejected', async () => {
    const superAdmin = await registerAndLogin(
      'E2E Super Admin',
      UserRole.SUPER_ADMIN,
    );
    const participant = await registerAndLogin('E2E Participant');

    // Participant cannot create a role.
    await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${participant.token}`)
      .send({
        name: `Reg Team ${randomUUID()}`,
        permissions: [
          {
            service: 'EVENTS',
            canRead: true,
            canWrite: true,
            canDelete: false,
          },
        ],
      })
      .expect(403);

    // SUPER_ADMIN creates a role scoped to EVENTS read+write.
    const roleName = `Registration Team ${randomUUID()}`;
    const createRes = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        name: roleName,
        description: 'Handles event content',
        permissions: [
          {
            service: 'EVENTS',
            canRead: true,
            canWrite: true,
            canDelete: false,
          },
          {
            service: 'PAYMENTS',
            canRead: false,
            canWrite: false,
            canDelete: false,
          },
        ],
      })
      .expect(201);

    const roleId = (
      createRes.body as SuccessResponse<{
        id: string;
        permissions: { service: string }[];
      }>
    ).data.id;

    // Duplicate name -> 409.
    await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        name: roleName,
        permissions: [],
      })
      .expect(409);

    // Update the role's permissions.
    await request(app.getHttpServer())
      .patch(`/api/admin/roles/${roleId}`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        permissions: [
          { service: 'EVENTS', canRead: true, canWrite: true, canDelete: true },
        ],
      })
      .expect(200);

    const getRes = await request(app.getHttpServer())
      .get(`/api/admin/roles/${roleId}`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .expect(200);

    const roleBody = (
      getRes.body as SuccessResponse<{
        permissions: { service: string; canDelete: boolean }[];
      }>
    ).data;
    expect(roleBody.permissions).toHaveLength(1);
    expect(roleBody.permissions[0].canDelete).toBe(true);
  });

  it('assigning a custom role grants scoped access; unassigning revokes it', async () => {
    const superAdmin = await registerAndLogin(
      'E2E Super Admin Assign',
      UserRole.SUPER_ADMIN,
    );

    const roleName = `Events Scoped Role ${randomUUID()}`;
    const createRes = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        name: roleName,
        permissions: [
          {
            service: 'EVENTS',
            canRead: true,
            canWrite: true,
            canDelete: false,
          },
        ],
      })
      .expect(201);

    const roleId = (createRes.body as SuccessResponse<{ id: string }>).data.id;

    const member = await registerAndLogin('E2E Scoped Member');

    // Before assignment: PARTICIPANT gets 403 on the events admin endpoint.
    await request(app.getHttpServer())
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);

    // SUPER_ADMIN assigns the custom role.
    await request(app.getHttpServer())
      .patch(`/api/admin/users/${member.userId}/custom-role`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({ customRoleId: roleId })
      .expect(200);

    // Now the member can read events (granted) but not payments (not granted).
    await request(app.getHttpServer())
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/admin/payments')
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);

    // Deleting a role that's still assigned is rejected.
    await request(app.getHttpServer())
      .delete(`/api/admin/roles/${roleId}`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .expect(409);

    // Unassign the role.
    await request(app.getHttpServer())
      .patch(`/api/admin/users/${member.userId}/custom-role`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({ customRoleId: null })
      .expect(200);

    // Access is revoked immediately (fresh DB check per request, no caching).
    await request(app.getHttpServer())
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${member.token}`)
      .expect(403);

    // Now the unassigned role can be deleted.
    await request(app.getHttpServer())
      .delete(`/api/admin/roles/${roleId}`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .expect(200);
  });

  it('ADMIN and SUPER_ADMIN always bypass permission checks regardless of custom role', async () => {
    const admin = await registerAndLogin('E2E Bypass Admin', UserRole.ADMIN);

    await request(app.getHttpServer())
      .get('/api/admin/events')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/admin/payments')
      .set('Authorization', `Bearer ${admin.token}`)
      .expect(200);
  });

  it("GET /auth/me includes the caller's custom role", async () => {
    const superAdmin = await registerAndLogin(
      'E2E Super Admin Me',
      UserRole.SUPER_ADMIN,
    );

    const roleName = `Me Endpoint Role ${randomUUID()}`;
    const createRes = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        name: roleName,
        permissions: [
          {
            service: 'CONTENT',
            canRead: true,
            canWrite: false,
            canDelete: false,
          },
        ],
      })
      .expect(201);
    const roleId = (createRes.body as SuccessResponse<{ id: string }>).data.id;

    const member = await registerAndLogin('E2E Me Member');

    await request(app.getHttpServer())
      .patch(`/api/admin/users/${member.userId}/custom-role`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({ customRoleId: roleId })
      .expect(200);

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${member.token}`)
      .expect(200);

    const meBody = (meRes.body as SuccessResponse<UserProfile>).data;
    expect(meBody.customRole?.name).toBe(roleName);
    expect(meBody.customRole?.permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ service: 'CONTENT', canRead: true }),
      ]),
    );
  });

  it('custom-role assignment is restricted to SUPER_ADMIN, even for ADMIN', async () => {
    const admin = await registerAndLogin('E2E Admin Not Super', UserRole.ADMIN);
    const target = await registerAndLogin('E2E Assignment Target');

    const res = await request(app.getHttpServer())
      .patch(`/api/admin/users/${target.userId}/custom-role`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ customRoleId: null })
      .expect(403);

    const body = res.body as ErrorResponse;
    expect(body.success).toBe(false);
  });
});

// Own app instance: this file's first describe block already uses most of
// the shared login-throttle budget (10/min per process) — see the note on
// registerAndLogin above. This block needs 3 more logins, so it gets its own
// throttle bucket.
describe('Roles & permissions: service granularity (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  async function registerAndLogin(name: string, role?: UserRole) {
    const email = `${randomUUID()}@infinito.dev`;
    const prisma = app.get(PrismaService);

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ email, password: PASSWORD, name, consent: true })
      .expect(201);

    if (role) {
      await prisma.user.update({ where: { email }, data: { role } });
    }

    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email, password: PASSWORD })
      .expect(200);

    const data = (
      login.body as SuccessResponse<{ accessToken: string; user: UserProfile }>
    ).data;

    return { email, token: data.accessToken, userId: data.user.id };
  }

  it('SPONSORS is separate from CA, and GALLERY is separate from CONTENT', async () => {
    const superAdmin = await registerAndLogin(
      'E2E Super Admin Split Services',
      UserRole.SUPER_ADMIN,
    );

    const caOnlyRole = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        name: `CA Only ${randomUUID()}`,
        permissions: [
          { service: 'CA', canRead: true, canWrite: true, canDelete: false },
        ],
      })
      .expect(201);
    const caOnlyRoleId = (caOnlyRole.body as SuccessResponse<{ id: string }>)
      .data.id;

    const contentOnlyRole = await request(app.getHttpServer())
      .post('/api/admin/roles')
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({
        name: `Content Only ${randomUUID()}`,
        permissions: [
          {
            service: 'CONTENT',
            canRead: true,
            canWrite: true,
            canDelete: false,
          },
        ],
      })
      .expect(201);
    const contentOnlyRoleId = (
      contentOnlyRole.body as SuccessResponse<{ id: string }>
    ).data.id;

    const caMember = await registerAndLogin('E2E CA Only Member');
    await request(app.getHttpServer())
      .patch(`/api/admin/users/${caMember.userId}/custom-role`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({ customRoleId: caOnlyRoleId })
      .expect(200);

    // CA access granted, but brands (now SPONSORS) stays denied.
    await request(app.getHttpServer())
      .get('/api/admin/ca-tasks')
      .set('Authorization', `Bearer ${caMember.token}`)
      .expect(200);
    await request(app.getHttpServer())
      .get('/api/admin/brands')
      .set('Authorization', `Bearer ${caMember.token}`)
      .expect(403);

    const contentMember = await registerAndLogin('E2E Content Only Member');
    await request(app.getHttpServer())
      .patch(`/api/admin/users/${contentMember.userId}/custom-role`)
      .set('Authorization', `Bearer ${superAdmin.token}`)
      .send({ customRoleId: contentOnlyRoleId })
      .expect(200);

    // CONTENT (team bios) access granted, but gallery stays denied.
    await request(app.getHttpServer())
      .post('/api/admin/team')
      .set('Authorization', `Bearer ${contentMember.token}`)
      .field('name', 'E2E Team Member')
      .field('department', 'Organizing Committee')
      .expect(201);
    await request(app.getHttpServer())
      .patch('/api/admin/gallery/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${contentMember.token}`)
      .send({ caption: 'nope' })
      .expect(403);
  });
});
