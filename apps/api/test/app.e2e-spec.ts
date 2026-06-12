import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import type {
  SuccessResponse,
  ErrorResponse,
} from './../src/common/envelope/envelope.types';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns success envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/health')
      .expect(200);
    const body = response.body as SuccessResponse<{ status: string }>;
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.timestamp).toBeDefined();
  });

  it('GET /api/nonexistent returns 404 error envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/nonexistent')
      .expect(404);
    const body = response.body as ErrorResponse;
    expect(body.success).toBe(false);
    expect(body.error.code).toBeDefined();
    expect(body.meta.requestId).toBeDefined();
  });
});
