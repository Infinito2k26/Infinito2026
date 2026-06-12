# Plan: Sprint 1 Core API Scaffolding

## Issue

- GitHub: https://github.com/Infinito2k26/Infinito2026/issues/5
- Title: `Core API Scaffolding: Config, Prisma Module, Response Envelope, Exception Filter`
- Owner: `mdminhaj-2106`
- Track: Lead / Backend
- Priority: P0
- Branch: `feature/core-api-scaffolding`
- Target: `develop`

## Outcome

The NestJS API has the shared foundation that every backend module will depend on: typed environment validation, global validation pipe, response envelope, exception filter, request IDs, health endpoints, and a clean Prisma integration boundary.

## Why This Comes First

Issues #2 and #3 can proceed in parallel, but backend feature work will drift quickly without a core API contract. This lead-owned track creates the guardrails juniors and intermediate developers can build inside safely.

## Scope

In scope:

- Environment validation.
- Global request validation.
- Standard success/error response envelope.
- Global exception filter.
- Request ID middleware/interceptor.
- Health endpoint.
- Prisma module skeleton that can consume the generated client after issue #2.
- Fix existing `no-floating-promises` warning in `main.ts`.

Out of scope:

- Full auth module.
- Full Prisma schema ownership.
- Payment, registration, or QR business logic.
- Production observability stack.

## Files to Read First

- `ANTIGRAVITY.md`
- `reference/api.md`
- `reference/architecture.md`
- `reference/database.md`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/package.json`
- `apps/api/test/app.e2e-spec.ts`

## Dependencies to Add

Recommended:

```bash
npm install @nestjs/config zod --workspace=api
```

Later, after issue #2 merges:

```bash
npm install @prisma/client --workspace=api
```

## Files to Change

```text
apps/api/src/main.ts
apps/api/src/app.module.ts
apps/api/src/common/
apps/api/src/config/
apps/api/src/health/
apps/api/src/prisma/
apps/api/test/app.e2e-spec.ts
apps/api/package.json
package-lock.json
reference/api.md
```

## Implementation Steps

1. Add `@nestjs/config` and `zod`.

2. Create `config/env.schema.ts`:
   - `NODE_ENV`
   - `PORT`
   - `DATABASE_URL`
   - `REDIS_URL`
   - `S3_ENDPOINT`
   - `S3_ACCESS_KEY_ID`
   - `S3_SECRET_ACCESS_KEY`
   - `S3_BUCKET`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `QR_SIGNING_SECRET`

3. Create `ConfigModule` wiring in `app.module.ts`.

4. Add global `ValidationPipe` in `main.ts`:
   - `whitelist: true`
   - `forbidNonWhitelisted: true`
   - `transform: true`

5. Fix bootstrap warning:
   ```ts
   void bootstrap();
   ```

6. Create common envelope types:
   - success shape
   - error shape
   - metadata with request ID and timestamp

7. Create `GlobalExceptionFilter`:
   - catches `HttpException`
   - catches unexpected errors as `INTERNAL_SERVER_ERROR`
   - returns `reference/api.md` error envelope

8. Create `ResponseEnvelopeInterceptor`:
   - wraps successful controller responses
   - preserves existing HTTP status

9. Create request ID middleware or interceptor:
   - read `x-request-id` if provided
   - generate one if missing
   - attach to response header and envelope metadata

10. Add `HealthModule`:
    - `GET /health`
    - returns API status and timestamp
    - DB/Redis checks can be stubbed until Prisma/Redis modules exist

11. Create `PrismaModule` placeholder:
    - define final expected shape
    - do not block issue #2
    - if Prisma is already merged, wire the real client

12. Update API e2e tests:
    - `/health` returns success envelope
    - root route still works or is intentionally replaced
    - validation filter behavior is covered if a DTO endpoint exists

13. Validate:
    ```bash
    npm run lint --workspace=api
    npm run test --workspace=api
    npm run test:e2e --workspace=api
    npm run build --workspace=api
    ```

## Acceptance Criteria

- [ ] Env validation exists and fails fast on invalid required env.
- [ ] Global validation pipe is configured.
- [ ] Successful API responses use the standard envelope.
- [ ] Error API responses use the standard envelope.
- [ ] Response metadata includes request ID and timestamp.
- [ ] `GET /health` exists.
- [ ] `main.ts` no longer has the floating promise warning.
- [ ] API lint, unit tests, e2e tests, and build pass.
- [ ] `reference/api.md` remains aligned with implementation.

## Coordination Notes

- Coordinate with issue #2 so PrismaModule does not duplicate schema/client ownership.
- Tell frontend issue #3 owner that API responses will be enveloped, so future frontend fetch utilities should unwrap `data`.
- This PR should be reviewed before AuthModule work starts.
