# Plan: #5 Core API Scaffolding

## Issue

- GitHub: #5
- Track: Lead / Backend
- Priority: P0
- Owner: mdminhaj-2106
- Reviewer: Saad-Manda
- Branch: `feature/core-api-scaffolding` (from `develop`)

## Outcome

Every future NestJS module has a stable, tested foundation to build on:
typed env validation, global `ValidationPipe`, request IDs, standardised
success/error envelope, a global exception filter, a health endpoint, and
a `PrismaModule` placeholder ready to receive the generated client from
issue #2.

## Scope

In:
- Install `@nestjs/config`, `zod`
- `ConfigModule` with Zod env validation
- Global `ValidationPipe`
- Fix `bootstrap()` floating-promise warning
- Set global API prefix `/api`
- `SuccessResponse` / `ErrorResponse` envelope types
- `ResponseEnvelopeInterceptor` (wraps controller return values)
- `GlobalExceptionFilter` (maps `HttpException` + unexpected errors)
- `RequestIdMiddleware` (reads/generates `X-Request-Id`)
- `HealthModule` — `GET /api/health`
- `PrismaModule` + `PrismaService` placeholder (no schema yet)
- Update e2e test to cover health endpoint and envelope shape

Out:
- Full Prisma schema (issue #2)
- AuthModule, UsersModule, EventsModule
- BullMQ / Redis wiring
- Production observability (Datadog, OpenTelemetry)

## Files to Read First

- `CONSTITUTION.md`
- `.claude/reference/api.md`
- `.claude/reference/architecture.md`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/package.json`
- `apps/api/test/app.e2e-spec.ts`

## Files to Change / Create

```
apps/api/src/main.ts                                           fix void, add prefix + pipe
apps/api/src/app.module.ts                                     wire all new modules
apps/api/src/config/env.schema.ts                              new — Zod schema
apps/api/src/config/config.module.ts                           new — NestJS ConfigModule wrapper
apps/api/src/common/common.module.ts                           new
apps/api/src/common/envelope/envelope.types.ts                 new — shared interfaces
apps/api/src/common/interceptors/response-envelope.interceptor.ts  new
apps/api/src/common/filters/global-exception.filter.ts         new
apps/api/src/common/middleware/request-id.middleware.ts        new
apps/api/src/health/health.module.ts                           new
apps/api/src/health/health.controller.ts                       new
apps/api/src/prisma/prisma.module.ts                           new
apps/api/src/prisma/prisma.service.ts                          new
apps/api/test/app.e2e-spec.ts                                  update tests
apps/api/package.json                                          add deps
package-lock.json                                              updated by npm
.env.example                                                   new — document required vars
```

## Implementation Steps

### Step 1 — Branch

```bash
git checkout develop
git pull
git checkout -b feature/core-api-scaffolding
```

### Step 2 — Install dependencies

```bash
npm install @nestjs/config zod --workspace=api
```

`@prisma/client` is added after issue #2 merges — do not add it now.

### Step 3 — Create `.env.example`

Document every required environment variable so the team knows what to
set up locally. All values are sample placeholders — never commit real
secrets.

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://infinito:infinito@localhost:5432/infinito
REDIS_URL=redis://localhost:6379
S3_ENDPOINT=http://localhost:9000
S3_ACCESS_KEY_ID=minioadmin
S3_SECRET_ACCESS_KEY=minioadmin
S3_BUCKET=infinito-dev
JWT_ACCESS_SECRET=change-me-access
JWT_REFRESH_SECRET=change-me-refresh
QR_SIGNING_SECRET=change-me-qr
```

### Step 4 — `apps/api/src/config/env.schema.ts`

Zod object that validates and transforms `process.env`. Fail fast if any
required variable is missing.

```ts
import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  S3_ENDPOINT: z.string().url(),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  QR_SIGNING_SECRET: z.string().min(32),
});

export type Env = z.infer<typeof envSchema>;
```

### Step 5 — `apps/api/src/config/config.module.ts`

Wrap NestJS `ConfigModule` with the Zod validation function. Use
`isGlobal: true` so every module can inject `ConfigService` without
re-importing.

```ts
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { envSchema } from './env.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      validate: (config) => envSchema.parse(config),
    }),
  ],
})
export class AppConfigModule {}
```

### Step 6 — `apps/api/src/common/envelope/envelope.types.ts`

Plain TypeScript interfaces that match `.claude/reference/api.md`.

```ts
export interface EnvelopeMeta {
  requestId: string;
  timestamp: string;
}

export interface SuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta: EnvelopeMeta;
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: EnvelopeMeta;
}
```

### Step 7 — `apps/api/src/common/middleware/request-id.middleware.ts`

Read `x-request-id` header if provided; otherwise generate a random ID.
Attach to the response header and to `request` so downstream code can
read it.

```ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const id = (req.headers['x-request-id'] as string) ?? randomUUID();
    req['requestId'] = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
```

### Step 8 — `apps/api/src/common/interceptors/response-envelope.interceptor.ts`

Wrap every successful response in the standard envelope. Preserve the
HTTP status code set by the controller.

```ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { Request } from 'express';
import { SuccessResponse } from '../envelope/envelope.types';

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<SuccessResponse> {
    const req = context.switchToHttp().getRequest<Request>();
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data: data ?? null,
        meta: {
          requestId: (req['requestId'] as string) ?? 'unknown',
          timestamp: new Date().toISOString(),
        },
      })),
    );
  }
}
```

### Step 9 — `apps/api/src/common/filters/global-exception.filter.ts`

Catch `HttpException` and map to the error envelope. Catch everything
else as 500. Log unexpected errors to stderr.

```ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponse } from '../envelope/envelope.types';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();
    const requestId = (req['requestId'] as string) ?? 'unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'An unexpected error occurred';
    let details: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      code = HttpStatus[status] ?? 'HTTP_ERROR';
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body !== null) {
        const b = body as Record<string, unknown>;
        message = (b['message'] as string) ?? message;
        details = b['details'];
      }
    } else {
      this.logger.error('Unhandled exception', exception instanceof Error ? exception.stack : String(exception));
    }

    const body: ErrorResponse = {
      success: false,
      error: { code, message, ...(details !== undefined && { details }) },
      meta: { requestId, timestamp: new Date().toISOString() },
    };

    res.status(status).json(body);
  }
}
```

### Step 10 — `apps/api/src/common/common.module.ts`

Export the interceptor and filter so `AppModule` can register them
globally.

```ts
import { Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { GlobalExceptionFilter } from './filters/global-exception.filter';
import { ResponseEnvelopeInterceptor } from './interceptors/response-envelope.interceptor';

@Module({
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
  ],
})
export class CommonModule {}
```

### Step 11 — `apps/api/src/health/health.controller.ts`

Single `GET /health` endpoint. No external DB/Redis check yet — those
are added once PrismaModule and RedisModule are wired.

```ts
import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok' };
  }
}
```

Note: `ResponseEnvelopeInterceptor` wraps this, so the client receives
the full `SuccessResponse` envelope automatically.

### Step 12 — `apps/api/src/health/health.module.ts`

```ts
import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({ controllers: [HealthController] })
export class HealthModule {}
```

### Step 13 — `apps/api/src/prisma/prisma.service.ts`

Placeholder with the correct lifecycle hooks. `PrismaClient` is not yet
available (issue #2). Stub with an inline comment explaining the expected
shape so that when issue #2 merges, this file receives a one-line import.

```ts
import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

// Replace stub with: import { PrismaClient } from '@prisma/client';
// Then extend PrismaClient instead of the empty class below.
// npm install @prisma/client --workspace=api  (after issue #2 merges)

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // await this.$connect();
  }

  async onModuleDestroy() {
    // await this.$disconnect();
  }
}
```

### Step 14 — `apps/api/src/prisma/prisma.module.ts`

```ts
import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
```

### Step 15 — Update `apps/api/src/app.module.ts`

```ts
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [AppConfigModule, CommonModule, HealthModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
```

### Step 16 — Update `apps/api/src/main.ts`

Three changes: fix floating promise, set global prefix `/api`, add
global `ValidationPipe`.

```ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}

void bootstrap();
```

### Step 17 — Update `apps/api/test/app.e2e-spec.ts`

The existing test hits `GET /` and expects `Hello World!`. That no longer
applies once the global prefix and envelope interceptor are live.

Replace with tests that verify:
1. `GET /api/health` returns 200 with `{ success: true, data: { status: 'ok' } }`.
2. `GET /api` (the old root) still returns 200 wrapped in the envelope.
3. `GET /api/nonexistent` returns 404 error envelope with `success: false`.

```ts
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('API (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/health returns success envelope', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('ok');
    expect(body.meta.requestId).toBeDefined();
    expect(body.meta.timestamp).toBeDefined();
  });

  it('GET /api/nonexistent returns 404 error envelope', async () => {
    const { body } = await request(app.getHttpServer()).get('/api/nonexistent').expect(404);
    expect(body.success).toBe(false);
    expect(body.error.code).toBeDefined();
    expect(body.meta.requestId).toBeDefined();
  });
});
```

### Step 18 — Validate

Run these before opening the PR. All must be green.

```bash
npm run lint --workspace=api
npm run check-types --workspace=api
npm run test --workspace=api
npm run test:e2e --workspace=api
npm run build --workspace=api
```

### Step 19 — Open PR

- Title: `feat(api): core scaffolding — config, envelope, exception filter, health, prisma stub`
- Body: `Closes #5`
- Base: `develop`
- Reviewers: Saad-Manda

## Tests and Validation

```bash
npm run lint --workspace=api
npm run check-types --workspace=api
npm run test --workspace=api
npm run test:e2e --workspace=api
npm run build --workspace=api
```

## Acceptance Criteria

- [ ] Env validation runs at boot and fails fast on missing required variables
- [ ] Global `ValidationPipe` is configured with `whitelist` and `forbidNonWhitelisted`
- [ ] Successful API responses match the `SuccessResponse` envelope
- [ ] Error API responses match the `ErrorResponse` envelope
- [ ] `meta.requestId` and `meta.timestamp` appear in every response
- [ ] `X-Request-Id` header is returned on every response
- [ ] `GET /api/health` returns 200
- [ ] `main.ts` has `void bootstrap()` (no floating promise)
- [ ] `PrismaModule` and `PrismaService` exist and export correctly
- [ ] API lint, typecheck, unit tests, e2e tests, and build all pass
- [ ] `.claude/reference/api.md` is still aligned (no changes needed unless endpoint map shifts)

## Risks

- **Env validation at test time:** e2e tests will fail if required env vars are not set.
  Mitigation: add a `apps/api/.env.test` with safe placeholder values for CI.
- **Interceptor ordering:** if another interceptor is added later that transforms the
  response, the envelope interceptor must wrap it outermost. Register `APP_INTERCEPTOR`
  tokens in order: envelope first, then any future interceptors.
- **PrismaService stub vs real client:** once issue #2 merges, `PrismaService` must be
  updated before any module tries to inject it. The stub comment documents this clearly.
- **Global prefix `/api`:** the existing e2e test hits `GET /` which no longer works.
  This plan replaces that test — do not leave the old assertion in place.

## Coordination Notes

- Coordinate with issue #2 (ansariowais669-hub + Saad-Manda): once the generated Prisma
  client exists, `PrismaService` needs two lines changed (`import` + `extends`).
- Tell issue #3 owner (Anjney-Lawaniya): API responses are always enveloped, so any fetch
  utility on the frontend must unwrap `.data` from the response body.
- This PR must be reviewed and merged before `AuthModule` work begins — auth depends on
  `PrismaModule`, `ConfigModule`, and the exception filter.
