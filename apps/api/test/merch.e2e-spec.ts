import { randomUUID } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types';
import { UserRole } from '@prisma/client';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';
import { UploadsService } from './../src/uploads/uploads.service';
import type { SuccessResponse } from './../src/common/envelope/envelope.types';
import type { UserProfile } from './../src/auth/auth.service';

// A real (if tiny) 4x4 PNG — FileTypeValidator sniffs actual magic bytes,
// not just the declared Content-Type, so a fake text buffer would
// legitimately fail validation (see auth.e2e-spec.ts's "renamed executable"
// test for the negative case). A hand-crafted 1x1 PNG wasn't enough
// sample data for the sniffer to detect reliably; this one is.
const FAKE_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAAEElEQVR4nGP4z8AARwzEcQCukw/x0F8jngAAAABJRU5ErkJggg==',
  'base64',
);

// Same fake as identity.e2e-spec.ts — real Cloudinary calls are out of scope.
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

async function registerAndLogin(app: INestApplication<App>, name: string) {
  const email = `${randomUUID()}@infinito.dev`;
  const password = 'a-strong-password';

  await request(app.getHttpServer())
    .post('/api/auth/register')
    .send({ email, password, name, consent: true })
    .expect(201);

  const login = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  const token = (
    login.body as SuccessResponse<{ accessToken: string; user: UserProfile }>
  ).data.accessToken;

  return { email, token };
}

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

  return { token };
}

interface MerchOrder {
  id: string;
  totalAmount: string | number;
  status: string;
  paymentStatus: string;
}

describe('Merch: full happy path (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  beforeAll(async () => {
    app = await createApp();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('browse -> order -> submit payment -> admin verifies -> order shows CONFIRMED', async () => {
    const admin = await registerLoginWithRole(
      app,
      prisma,
      'Merch Admin',
      UserRole.SUPER_ADMIN,
    );
    const buyer = await registerAndLogin(app, 'Merch Buyer');

    const createProductRes = await request(app.getHttpServer())
      .post('/api/admin/merch/products')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({
        name: 'Infinito 2K26 Tee',
        price: 500,
        sizesAvailable: ['M', 'L'],
      })
      .expect(201);
    const productId = (createProductRes.body as SuccessResponse<{ id: string }>)
      .data.id;

    const browseRes = await request(app.getHttpServer())
      .get('/api/merch/products')
      .expect(200);
    const products = (
      browseRes.body as SuccessResponse<{ products: { id: string }[] }>
    ).data.products;
    expect(products.some((p) => p.id === productId)).toBe(true);

    const createOrderRes = await request(app.getHttpServer())
      .post('/api/merch/orders')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({
        shippingName: 'Buyer Name',
        shippingPhone: '9999999999',
        shippingAddress: '123 Test Street',
        shippingPincode: '800001',
        items: [{ productId, size: 'M', quantity: 2 }],
      })
      .expect(201);
    const order = (createOrderRes.body as SuccessResponse<MerchOrder>).data;
    expect(Number(order.totalAmount)).toBe(1000); // 500 * 2, server-computed
    expect(order.status).toBe('PENDING_PAYMENT');

    await request(app.getHttpServer())
      .post(`/api/merch/orders/${order.id}/payment`)
      .set('Authorization', `Bearer ${buyer.token}`)
      .field('transactionId', 'TXN12345')
      .field('idempotencyKey', randomUUID())
      .attach('file', FAKE_PNG, {
        filename: 'proof.png',
        contentType: 'image/png',
      })
      .expect(201);

    const verifyRes = await request(app.getHttpServer())
      .patch(`/api/admin/merch/orders/${order.id}/verify`)
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ status: 'SUCCESS' })
      .expect(200);
    expect((verifyRes.body as SuccessResponse<MerchOrder>).data.status).toBe(
      'CONFIRMED',
    );

    const myOrdersRes = await request(app.getHttpServer())
      .get('/api/merch/orders/mine')
      .set('Authorization', `Bearer ${buyer.token}`)
      .expect(200);
    const myOrders = (
      myOrdersRes.body as SuccessResponse<{ orders: MerchOrder[] }>
    ).data.orders;
    expect(myOrders.find((o) => o.id === order.id)?.status).toBe('CONFIRMED');
  });

  it('rejects ordering an out-of-stock product', async () => {
    const admin = await registerLoginWithRole(
      app,
      prisma,
      'Merch Admin 2',
      UserRole.SUPER_ADMIN,
    );
    const buyer = await registerAndLogin(app, 'Merch Buyer 2');

    const createProductRes = await request(app.getHttpServer())
      .post('/api/admin/merch/products')
      .set('Authorization', `Bearer ${admin.token}`)
      .send({ name: 'Sold Out Hoodie', price: 800, inStock: false })
      .expect(201);
    const productId = (createProductRes.body as SuccessResponse<{ id: string }>)
      .data.id;

    await request(app.getHttpServer())
      .post('/api/merch/orders')
      .set('Authorization', `Bearer ${buyer.token}`)
      .send({
        shippingName: 'Buyer Name',
        shippingPhone: '9999999999',
        shippingAddress: '123 Test Street',
        shippingPincode: '800001',
        items: [{ productId, quantity: 1 }],
      })
      .expect(400);
  });
});
