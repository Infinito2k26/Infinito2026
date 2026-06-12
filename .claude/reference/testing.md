# Infinito Testing and Validation Strategy

## 1. Quality Gates

Run before handoff:

```bash
npm run lint
npm run check-types
npm run build
npm run test --workspace=api
```

When API e2e tests are affected:

```bash
npm run test:e2e --workspace=api
```

## 2. Test Pyramid

| Layer                | Tooling                   | Purpose                                    |
| -------------------- | ------------------------- | ------------------------------------------ |
| Unit                 | Jest                      | Pure services, guards, utility logic       |
| API integration      | Jest + Supertest          | Controllers, pipes, filters, module wiring |
| Database integration | Prisma test database      | transactions, constraints, idempotency     |
| Browser E2E          | Playwright when added     | registration, payment mock, QR/admin flows |
| Manual QA            | Browser + mobile viewport | visual and operational checks              |

## 3. Required Critical Tests

Before launch, the following flows need automated coverage:

1. Register -> login -> get current user.
2. Admin creates event -> public event list includes it.
3. Team captain creates team -> second user joins by invite.
4. Team registration starts -> payment order is created.
5. Duplicate registration for same event/team returns `409`.
6. Razorpay webhook replay does not duplicate confirmation.
7. Confirmed registration creates exactly one QR credential.
8. Valid QR scan records a scan log.
9. Tampered QR token is rejected.
10. Admin registration list filters by event and status.

## 4. Frontend Verification

For every user-facing feature:

- Check mobile width around 375px.
- Check desktop width around 1440px.
- Verify loading, empty, error, and success states.
- Verify forms show validation errors without layout shift.
- Verify buttons and links are keyboard accessible.

## 5. PR Verification Notes

Every PR must include:

- Commands run.
- Any commands not run and why.
- Screenshots or screen recordings for visual UI changes.
- Test data or seed assumptions.
- Linked issue acceptance criteria status.
