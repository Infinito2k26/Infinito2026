# Architectural Roadmap

# Infinito 2K26 — End-to-End Architecture & Engineering Roadmap
> **IIT Patna's Annual Sports Fest Platform** Authored by: Chief Product Architect & Engineering Strategist Version: 1.0 | Classification: Internal Engineering Blueprint
* * *
## Table of Contents
1. [Platform Context & Scale Requirements](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#1-platform-context--scale-requirements)
2. [Current System Audit](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#2-current-system-audit)
3. [Root Cause Problem Analysis](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#3-root-cause-problem-analysis)
4. [Architectural Philosophy & Decision Framework](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#4-architectural-philosophy--decision-framework)
5. [System Architecture Overview](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#5-system-architecture-overview)
6. [Database Design & Schema](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#6-database-design--schema)
7. [Backend Architecture — NestJS Modular Monolith](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#7-backend-architecture--nestjs-modular-monolith)
8. [Authentication & Authorization Design](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#8-authentication--authorization-design)
9. [API Design & Conventions](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#9-api-design--conventions)
10. [Frontend Architecture — Next.js](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#10-frontend-architecture--nextjs)
11. [Real-Time Systems](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#11-real-time-systems)
12. [Background Job Architecture](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#12-background-job-architecture)
13. [QR-Based Unified Identity System](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#13-qr-based-unified-identity-system)
14. [Payment System Design](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#14-payment-system-design)
15. [Caching Strategy](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#15-caching-strategy)
16. [Security Hardening](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#16-security-hardening)
17. [Infrastructure & Deployment Architecture](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#17-infrastructure--deployment-architecture)
18. [CI/CD Pipeline](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#18-cicd-pipeline)
19. [Monitoring, Observability & Alerting](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#19-monitoring-observability--alerting)
20. [Testing Strategy](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#20-testing-strategy)
21. [UI/UX Design System](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#21-uiux-design-system)
22. [Feature Prioritization Matrix](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#22-feature-prioritization-matrix)
23. [Engineering Timeline & Sprints](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#23-engineering-timeline--sprints)
24. [Team Structure & Responsibilities](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#24-team-structure--responsibilities)
25. [Migration Strategy](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#25-migration-strategy)
26. [Future Scaling Recommendations](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#26-future-scaling-recommendations)
27. [Common Pitfalls to Avoid](https://claude.ai/chat/5046ced2-91f5-4ca1-a044-bf4758a052ff#27-common-pitfalls-to-avoid)
* * *
## 1\. Platform Context & Scale Requirements
### About Infinito
Infinito is IIT Patna's annual inter-collegiate sports festival — Eastern India's largest sports fest. The 2025 edition brought together **1,200+ athletes from 55+ colleges** across India over three days. The 2K26 edition is expected to scale further, requiring a platform built for real-world operational load, not just a registration form with a landing page.
### Traffic Profile

| Scenario | Expected Load |
| ---| --- |
| Registration window open | 500–1,000 concurrent users |
| Registration deadline burst | 2,000–3,000 requests/minute |
| Fest day check-in | 300–500 QR scans/hour |
| Live score updates | 1,000+ concurrent WebSocket connections |
| Peak API traffic | ~10,000 requests/hour |

### User Roles in the Real World
The platform must support at least **eight distinct user archetypes**, each with different workflows and access levels. A volunteer helping at a venue entrance needs to scan QR codes offline. A Campus Ambassador needs to track referral-based registrations. A team captain needs to see their entire team's registration status in one place. These are **workflow problems**, not just permission problems — and the architecture must reflect that.
* * *
## 2\. Current System Audit
### Repository Structure (Current State)

```php
infinito-backend/
├── controllers/
│   └── eventRegistration.controller.js   # ~1,300 lines. God object anti-pattern.
├── models/
│   └── events.model.js                   # 18+ schema definitions in one file
├── routes/
│   └── index.js
├── middleware/
│   └── auth.js
└── server.js

infinito-frontend/
├── src/
│   ├── pages/                            # Flat structure, no route grouping
│   ├── components/                       # No colocated component isolation
│   ├── context/                          # Context API overuse
│   └── styles/                           # Mixed CSS modules + raw CSS + Tailwind
```

### Identified Architectural Failures
**Backend**

| Issue | Severity | Impact |
| ---| ---| --- |
| Monolithic Express controller (1,300+ lines) | Critical | Unmaintainable, untestable |
| 18+ Mongoose schemas in one model file | Critical | Cannot add a new sport without touching core schema |
| No async task processing (sync email + payment verify) | Critical | Server blocks on heavy I/O; timeouts under load |
| Hardcoded role strings instead of RBAC | High | Security risk; no audit trail |
| No request validation layer | High | Injection-prone, unstable under bad inputs |
| No database indexing strategy | High | Slow queries at scale |
| No connection pooling | Medium | DB connection exhaustion under traffic burst |
| No retry/idempotency on payments | High | Duplicate charges, lost transactions |
| No rate limiting on auth endpoints | High | Brute-force vulnerable |
| No structured logging | Medium | Impossible to debug production issues |

**Database (MongoDB / Mongoose)**

| Issue | Severity |
| ---| --- |
| One schema per sport — 18 separate schemas for logically identical data | Critical |
| No referential integrity | High |
| No indexing on frequently queried fields (email, teamId, eventId) | High |
| Deeply nested subdocuments causing uncontrolled document growth | Medium |
| No migration tooling | Medium |

**Frontend (React / Vite)**

| Issue | Severity |
| ---| --- |
| No server-side rendering — poor SEO, poor initial load | High |
| No server state management (React Query / SWR) — manual fetch, no caching | High |
| Mixed styling systems — inconsistent UI | Medium |
| Context API for global state — re-render storms on shared state | Medium |
| No loading/skeleton states — jarring UX under slow network | Medium |
| No mobile-first design — 80%+ traffic is mobile | High |
| No code splitting or lazy loading | Medium |

**Operations & Security**
*   No environment variable management strategy (secrets likely in code)
*   No CI/CD pipeline
*   No monitoring, alerting, or error tracking
*   No backup strategy for the database
*   Razorpay webhook signature verification likely absent or incomplete
* * *
## 3\. Root Cause Problem Analysis
### The Three Core Architectural Diseases
**Disease 1: The God Object Controller** The root problem is that the application has no layered architecture. Controllers do validation, business logic, database operations, and email sending simultaneously. This means:
*   You cannot test any of this logic without spinning up the entire HTTP server
*   A bug in email sending can break payment confirmation
*   Adding a new sport requires reading and modifying a 1,300-line file
**Disease 2: The Schema-Per-Sport Anti-Pattern** Creating a Mongoose schema for each sport is treating a _data modeling problem_ as a _code organization problem_. The correct model is: one `Event` entity with configurable `teamSizeMin`, `teamSizeMax`, `rules`, and `category` fields. Adding a new sport should require **zero code changes** — only an admin dashboard action.
**Disease 3: Synchronous I/O on the Critical Path** Sending confirmation emails and verifying Razorpay payments inside the HTTP request handler will cause timeouts during peak traffic. A single Razorpay verification can take 200–800ms. With 100 concurrent registrations during the last-minute rush, this becomes the primary failure mode.
* * *
## 4\. Architectural Philosophy & Decision Framework
### Why Modular Monolith (Not Microservices)
The platform is built and maintained by a small team of college students with a budget constraint. Microservices introduce:
*   Complex distributed tracing
*   Service-to-service authentication overhead
*   Network latency between services
*   Significantly more DevOps complexity
A **Modular Monolith** gives us:
*   Clear domain boundaries (just like microservices) through NestJS modules
*   Single deployment unit (simple to manage)
*   Shared database with proper schema design
*   Easy future extraction of hot modules (e.g., registration engine) into a separate service if traffic demands
**The rule**: Enforce module boundaries in code. If modules don't import each other's internal services, you can extract them into microservices later with minimal refactoring.
### Technology Decision Rationale

| Technology | Chosen | Why Not Alternatives |
| ---| ---| --- |
| NestJS | ✅ | Enforces architecture. DI, decorators, native TypeScript. Express is too permissive — it lets you write spaghetti. |
| PostgreSQL | ✅ | Our data is relational (Users → Teams → Events → Payments). Relational integrity matters for money and fairness. MongoDB's flexibility is a liability here. |
| Prisma ORM | ✅ | Type-safe queries. Auto-generated migrations. Better DX than TypeORM. |
| Redis | ✅ | Session cache, rate limiting counters, BullMQ queue broker. Single-purpose, battle-tested. |
| BullMQ | ✅ | Built on Redis. Named queues, retries, dead-letter queues. Far superior to raw setImmediate hacks. |
| Next.js (App Router) | ✅ | Server Components for public pages (SEO). Client components for dashboards. Best-in-class DX. |
| TanStack Query | ✅ | Server state management. Eliminates redundant data fetching. Automatic cache invalidation. |
| Zustand | ✅ | Lightweight client state. No boilerplate. Easy devtools integration. |

* * *
## 5\. System Architecture Overview

```php
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│  Next.js (App Router) · PWA · Mobile Web                           │
│  Server Components (public) + Client Components (dashboard)        │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTPS / WSS
┌───────────────────────────▼─────────────────────────────────────────┐
│                         EDGE / CDN                                  │
│  Cloudflare (static assets, DDoS protection, edge caching)         │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────────────┐
│                        NGINX REVERSE PROXY                          │
│  SSL termination · Rate limiting · WebSocket upgrade               │
│  Upstream routing: /api/* → NestJS  /  /* → Next.js               │
└──────────────┬────────────────────────────┬────────────────────────┘
               │                            │
┌──────────────▼──────────┐   ┌─────────────▼──────────────────────┐
│   NestJS API Server     │   │   Next.js App Server               │
│   (Modular Monolith)    │   │   (SSR + Static Generation)        │
│                         │   │                                    │
│  AuthModule             │   │  /                 (SSG)           │
│  UsersModule            │   │  /events           (SSG + ISR)     │
│  EventsModule           │   │  /dashboard        (CSR)           │
│  RegistrationModule     │   │  /admin            (CSR + RBAC)    │
│  PaymentsModule         │   └────────────────────────────────────┘
│  IdentityModule (QR)    │
│  NotificationsModule    │
│  ScheduleModule         │
│  LeaderboardModule      │
│  AdminModule            │
└──────────────┬──────────┘
               │
┌──────────────▼────────────────────────────────────────────────────┐
│                      PERSISTENCE LAYER                             │
│                                                                    │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │  PostgreSQL      │  │    Redis     │  │      AWS S3          │ │
│  │  (Primary DB)    │  │  (Cache +    │  │  (Profile pics,      │ │
│  │  Prisma ORM      │  │   Queue      │  │   QR assets,         │ │
│  │  PgBouncer pool  │  │   Broker)    │  │   media gallery)     │ │
│  └─────────────────┘  └──────────────┘  └──────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
               │
┌──────────────▼────────────────────────────────────────────────────┐
│                    ASYNC WORKER LAYER (BullMQ)                     │
│                                                                    │
│  email-queue      → Welcome emails, confirmation, reset password  │
│  payment-queue    → Razorpay verification & reconciliation        │
│  qr-queue         → QR code generation & PDF ticket packaging     │
│  notification-queue → Push + in-app notification dispatch         │
└───────────────────────────────────────────────────────────────────┘
```

* * *
## 6\. Database Design & Schema
### Design Principles
1. **Normalize early, denormalize selectively** — start with 3NF, add materialized views/caches for read-heavy endpoints
2. **Every model gets a UUID primary key** — avoids sequential ID guessing attacks
3. **Soft deletes everywhere** — `deletedAt TIMESTAMP NULL` instead of hard deletes for audit compliance
4. **Enum types in PostgreSQL** — not string columns — for role and status fields
5. **Composite indexes** for common query patterns, not just individual column indexes
### Core Schema (Prisma SDL)

```java
// ─── ENUMS ─────────────────────────────────────────────────────────

enum UserRole {
  SUPER_ADMIN
  ADMIN
  EVENT_MANAGER
  VOLUNTEER
  CAMPUS_AMBASSADOR
  TEAM_CAPTAIN
  PARTICIPANT
}

enum EventCategory {
  OUTDOOR_SPORTS   // Football, Cricket, Athletics
  INDOOR_SPORTS    // Badminton, Table Tennis, Chess
  ESPORTS          // FIFA, BGMI, Valorant
  CULTURAL         // Pro Night support events
}

enum RegistrationStatus {
  PENDING_PAYMENT
  CONFIRMED
  WAITLISTED
  CANCELLED
  REFUNDED
}

enum PaymentStatus {
  INITIATED
  SUCCESS
  FAILED
  REFUNDED
  RECONCILIATION_PENDING
}

// ─── CORE MODELS ───────────────────────────────────────────────────

model User {
  id               String        @id @default(uuid())
  email            String        @unique
  phone            String?       @unique
  passwordHash     String
  role             UserRole      @default(PARTICIPANT)
  isEmailVerified  Boolean       @default(false)
  isApproved       Boolean       @default(true)  // false for roles needing approval
  college          String?
  state            String?
  profilePicUrl    String?
  emergencyContact String?

  // Relations
  profile          Profile?
  qrIdentity       QRIdentity?
  teamsLed         Team[]        @relation("TeamLeader")
  teamMemberships  TeamMember[]
  registrations    Registration[]
  caProfile        CAProfile?
  volunteerProfile VolunteerProfile?
  notifications    Notification[]
  activityLogs     ActivityLog[]
  consents         Consent[]

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt
  deletedAt        DateTime?

  @@index([email])
  @@index([role])
  @@index([college])
}

model Event {
  id               String        @id @default(uuid())
  name             String        @unique
  slug             String        @unique   // "basketball-men", "chess-open"
  category         EventCategory
  description      String?
  rules            String?       // Markdown-formatted rules

  // Team configuration — eliminates per-sport schema anti-pattern
  isTeamEvent      Boolean       @default(true)
  teamSizeMin      Int           @default(1)
  teamSizeMax      Int           @default(1)

  // Scheduling
  venueId          String?
  venue            Venue?        @relation(fields: [venueId], references: [id])
  startDate        DateTime?
  endDate          DateTime?

  // Registration
  registrationFee  Float         @default(0)
  maxTeams         Int?          // null = unlimited
  isRegistrationOpen Boolean     @default(false)

  // Relations
  registrations    Registration[]
  matches          Match[]
  leaderboard      Leaderboard?

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([slug])
  @@index([category])
  @@index([isRegistrationOpen])
}

model Team {
  id               String        @id @default(uuid())
  name             String
  collegeName      String
  leaderId         String
  leader           User          @relation("TeamLeader", fields: [leaderId], references: [id])
  members          TeamMember[]
  registrations    Registration[]
  inviteCode       String        @unique @default(cuid())  // For team joining link

  createdAt        DateTime      @default(now())
  updatedAt        DateTime      @updatedAt

  @@index([leaderId])
  @@index([inviteCode])
}

model TeamMember {
  id               String   @id @default(uuid())
  teamId           String
  team             Team     @relation(fields: [teamId], references: [id])
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  joinedAt         DateTime @default(now())

  @@unique([teamId, userId])  // Prevents duplicate membership
  @@index([userId])
}

model Registration {
  id               String             @id @default(uuid())
  eventId          String
  event            Event              @relation(fields: [eventId], references: [id])
  teamId           String?
  team             Team?              @relation(fields: [teamId], references: [id])
  userId           String?            // For individual event registrations
  user             User?              @relation(fields: [userId], references: [id])
  status           RegistrationStatus @default(PENDING_PAYMENT)
  referenceNumber  String             @unique @default(cuid())
  transactionId    String?
  transaction      Transaction?       @relation(fields: [transactionId], references: [id])

  createdAt        DateTime           @default(now())
  updatedAt        DateTime           @updatedAt

  @@unique([eventId, teamId])  // Anti-duplicate registration
  @@unique([eventId, userId])
  @@index([status])
  @@index([referenceNumber])
}

model Transaction {
  id                 String        @id @default(uuid())
  razorpayOrderId    String        @unique
  razorpayPaymentId  String?       @unique
  amount             Float
  currency           String        @default("INR")
  status             PaymentStatus @default(INITIATED)
  webhookVerified    Boolean       @default(false)
  registrations      Registration[]

  createdAt          DateTime      @default(now())
  updatedAt          DateTime      @updatedAt

  @@index([razorpayOrderId])
  @@index([status])
}

model QRIdentity {
  id               String   @id @default(uuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  payload          String   @unique  // Signed JWT payload for offline verification
  qrImageUrl       String?
  isActive         Boolean  @default(true)
  lastScannedAt    DateTime?
  lastScannedBy    String?  // Volunteer userId

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
}

model Match {
  id               String   @id @default(uuid())
  eventId          String
  event            Event    @relation(fields: [eventId], references: [id])
  round            String   // "Quarter Final", "Semi Final", "Final"
  teamAId          String?
  teamBId          String?
  scoreA           Int?
  scoreB           Int?
  winnerId         String?
  scheduledAt      DateTime?
  venueId          String?
  venue            Venue?   @relation(fields: [venueId], references: [id])
  status           String   @default("SCHEDULED")  // SCHEDULED, LIVE, COMPLETED, CANCELLED

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([eventId])
  @@index([status])
}

model Accommodation {
  id               String   @id @default(uuid())
  userId           String   @unique
  roomNumber       String?
  checkIn          DateTime?
  checkOut         DateTime?
  isConfirmed      Boolean  @default(false)
  specialRequests  String?

  createdAt        DateTime @default(now())
}

model Announcement {
  id               String   @id @default(uuid())
  title            String
  body             String
  isPinned         Boolean  @default(false)
  isPublished      Boolean  @default(false)
  targetRole       UserRole? // null = all users
  publishedAt      DateTime?
  createdBy        String   // Admin userId

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  @@index([isPublished, isPinned])
}

model CAProfile {
  id               String   @id @default(uuid())
  userId           String   @unique
  user             User     @relation(fields: [userId], references: [id])
  referralCode     String   @unique
  targetCollege    String
  referralCount    Int      @default(0)
  isApproved       Boolean  @default(false)
  approvedBy       String?

  createdAt        DateTime @default(now())
}

model ActivityLog {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  action           String   // "REGISTRATION_CREATED", "PAYMENT_SUCCESS", "QR_SCANNED"
  metadata         Json?
  ipAddress        String?
  userAgent        String?

  createdAt        DateTime @default(now())

  @@index([userId])
  @@index([action])
  @@index([createdAt])
}
```

### Indexing Strategy

| Query Pattern | Index |
| ---| --- |
| Find user by email (login) | `@@index([email])` on User |
| Find registrations by status | `@@index([status])` on Registration |
| Find matches by event | `@@index([eventId])` on Match |
| Find published announcements | `@@index([isPublished, isPinned])` on Announcement |
| Find CA by referral code | `@@index([referralCode])` — unique constraint |
| Activity log range queries | `@@index([createdAt])` on ActivityLog |

* * *
## 7\. Backend Architecture — NestJS Modular Monolith
### Folder Structure

```ruby
apps/
└── api/                              # NestJS application
    ├── src/
    │   ├── main.ts                   # Bootstrap, global pipes, Swagger
    │   ├── app.module.ts             # Root module — imports all feature modules
    │   │
    │   ├── config/                   # Config service, env validation (joi/zod)
    │   │   └── configuration.ts
    │   │
    │   ├── common/                   # Shared across all modules
    │   │   ├── decorators/           # @CurrentUser(), @Roles(), @Public()
    │   │   ├── guards/               # JwtAuthGuard, RolesGuard
    │   │   ├── interceptors/         # LoggingInterceptor, TransformInterceptor
    │   │   ├── filters/              # GlobalExceptionFilter
    │   │   ├── pipes/                # ParseUUIDPipe, ValidationPipe
    │   │   └── types/                # Shared TypeScript interfaces
    │   │
    │   ├── prisma/                   # PrismaModule — global DB service
    │   │   ├── prisma.module.ts
    │   │   └── prisma.service.ts
    │   │
    │   ├── modules/
    │   │   ├── auth/
    │   │   │   ├── auth.module.ts
    │   │   │   ├── auth.controller.ts    # POST /auth/register, /login, /refresh
    │   │   │   ├── auth.service.ts       # JWT issuance, token rotation
    │   │   │   ├── strategies/           # JwtStrategy, GoogleStrategy
    │   │   │   └── dto/
    │   │   │
    │   │   ├── users/
    │   │   │   ├── users.module.ts
    │   │   │   ├── users.controller.ts
    │   │   │   ├── users.service.ts
    │   │   │   └── dto/
    │   │   │
    │   │   ├── events/
    │   │   │   ├── events.module.ts
    │  hu │   │   ├── events.controller.ts
    │   │   │   ├── events.service.ts
    │   │   │   └── dto/
    │   │   │
    │   │   ├── teams/
    │   │   │   ├── teams.module.ts
    │   │   │   ├── teams.controller.ts
    │   │   │   ├── teams.service.ts
    │   │   │   └── dto/
    │   │   │
    │   │   ├── registrations/
    │   │   │   ├── registrations.module.ts
    │   │   │   ├── registrations.controller.ts
    │   │   │   ├── registrations.service.ts    # Core registration engine
    │   │   │   ├── registrations.guard.ts      # Anti-duplicate guard
    │   │   │   └── dto/
    │   │   │
    │   │   ├── payments/
    │   │   │   ├── payments.module.ts
    │   │   │   ├── payments.controller.ts
    │   │   │   ├── payments.service.ts
    │   │   │   ├── webhook.controller.ts       # Razorpay webhook — no auth guard
    │   │   │   └── dto/
    │   │   │
    │   │   ├── identity/               # QR Code system
    │   │   │   ├── identity.module.ts
    │   │   │   ├── identity.controller.ts
    │   │   │   ├── identity.service.ts
    │   │   │   └── dto/
    │   │   │
    │   │   ├── notifications/
    │   │   │   ├── notifications.module.ts
    │   │   │   ├── notifications.service.ts
    │   │   │   └── notifications.gateway.ts    # WebSocket gateway
    │   │   │
    │   │   ├── matches/
    │   │   ├── schedule/
    │   │   ├── leaderboard/
    │   │   ├── announcements/
    │   │   ├── accommodation/
    │   │   └── admin/                          # Admin analytics, dashboards
    │   │
    │   └── workers/                    # BullMQ processors
    │       ├── email.worker.ts
    │       ├── payment.worker.ts
    │       ├── qr.worker.ts
    │       └── notification.worker.ts
    │
    ├── prisma/
    │   ├── schema.prisma
    │   └── migrations/
    │
    ├── Dockerfile
    └── package.json
```

### Registration Engine — The Core Service
The registration service is the most critical component. It must be:
*   **Idempotent**: The same request twice should not create two registrations
*   **Atomic**: Payment creation and registration creation happen in a Prisma transaction
*   **Validated**: Team size, event capacity, and duplicate checks happen before payment is initiated

```cs
// registrations.service.ts — simplified pseudo-code

async initiateRegistration(dto: CreateRegistrationDto, userId: string) {
  return this.prisma.$transaction(async (tx) => {

    // 1. Validate event is open
    const event = await tx.event.findUniqueOrThrow({ where: { id: dto.eventId } });
    if (!event.isRegistrationOpen) throw new BadRequestException('Registration closed');

    // 2. Anti-duplicate check
    const existing = await tx.registration.findFirst({
      where: { eventId: dto.eventId, teamId: dto.teamId ?? undefined }
    });
    if (existing) throw new ConflictException('Already registered for this event');

    // 3. Validate team size
    if (event.isTeamEvent) {
      const memberCount = await tx.teamMember.count({ where: { teamId: dto.teamId } });
      if (memberCount < event.teamSizeMin || memberCount > event.teamSizeMax) {
        throw new BadRequestException(`Team size must be between ${event.teamSizeMin} and ${event.teamSizeMax}`);
      }
    }

    // 4. Check event capacity
    if (event.maxTeams) {
      const confirmedCount = await tx.registration.count({
        where: { eventId: dto.eventId, status: 'CONFIRMED' }
      });
      if (confirmedCount >= event.maxTeams) throw new BadRequestException('Event is full');
    }

    // 5. Create Razorpay order
    const razorpayOrder = await this.paymentsService.createOrder(event.registrationFee);

    // 6. Create registration + transaction atomically
    const transaction = await tx.transaction.create({
      data: { razorpayOrderId: razorpayOrder.id, amount: event.registrationFee }
    });
    const registration = await tx.registration.create({
      data: { eventId: dto.eventId, teamId: dto.teamId, transactionId: transaction.id }
    });

    return { registration, razorpayOrder };
  });
}
```

### Module Isolation Rule
Modules MUST NOT import each other's services directly. Cross-module communication happens through:
1. **Events (EventEmitter2)**: For fire-and-forget operations (emit `registration.confirmed`, NotificationModule listens)
2. **Shared DTOs**: Types are shared via `common/types`, not module imports
3. **If direct coupling is needed**: The dependent module imports only the module, never the service directly, and only via the exported module interface
This is the key discipline that makes future microservice extraction possible.
* * *
## 8\. Authentication & Authorization Design
### Token Strategy

```sql
┌─────────────────────────────────────────────────────────────┐
│                      JWT TOKEN LIFECYCLE                     │
│                                                              │
│  Login → Issue Access Token (15 min, in memory/header)      │
│       → Issue Refresh Token (7 days, HttpOnly cookie)       │
│                                                              │
│  Every request → Validate Access Token                       │
│  Token expired → POST /auth/refresh                          │
│               → Validate Refresh Token from cookie          │
│               → Issue new Access Token + rotate Refresh     │
│                                                              │
│  Logout → Delete Refresh Token from Redis blocklist         │
└─────────────────────────────────────────────────────────────┘
```

**Why Refresh Token Rotation matters**: If a refresh token is stolen, it gets invalidated on first use by the legitimate user (since the attacker used it, the old one becomes invalid). The legitimate user gets logged out, but the attacker's session is also killed.
### Role-Based Access Control (RBAC)

```less
// Decorator usage in controllers
@Get('admin/registrations')
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
getAllRegistrations() { ... }

// Volunteer can only scan — not view payment data
@Post('identity/scan')
@Roles(UserRole.VOLUNTEER, UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)
scanQR(@Body() dto: ScanQRDto) { ... }
```

### Role Escalation Workflow
Campus Ambassadors, Volunteers, and Event Managers register with the `PARTICIPANT` role, then submit a role upgrade request. An admin reviews and approves/rejects. This is tracked in the `ActivityLog` with the approving admin's ID.
### OAuth (Google Sign-In)
Google OAuth is the recommended primary auth method for reducing friction. On Google callback:
1. Find or create user by `email`
2. Mark `isEmailVerified = true` (Google has already verified it)
3. Issue normal JWT pair
* * *
## 9\. API Design & Conventions
### URL Structure

```elixir
/api/v1/auth/register                POST    Public
/api/v1/auth/login                   POST    Public
/api/v1/auth/refresh                 POST    Public (cookie auth)
/api/v1/auth/logout                  POST    Authenticated

/api/v1/users/me                     GET     Self
/api/v1/users/me                     PATCH   Self
/api/v1/users/:id                    GET     Admin

/api/v1/events                       GET     Public (list, filterable)
/api/v1/events/:slug                 GET     Public
/api/v1/events                       POST    Admin
/api/v1/events/:id                   PATCH   Admin
/api/v1/events/:id/registrations     GET     Admin/EventManager

/api/v1/teams                        POST    Authenticated
/api/v1/teams/:id                    GET     Authenticated
/api/v1/teams/:id/members            POST    Authenticated (join via invite code)
/api/v1/teams/:id/members/:userId    DELETE  Team Captain / Admin

/api/v1/registrations                POST    Authenticated (initiate)
/api/v1/registrations/:id            GET     Self / Admin
/api/v1/registrations/:id/cancel     POST    Self / Admin

/api/v1/payments/verify              POST    Authenticated (post-payment client callback)
/api/v1/webhooks/razorpay            POST    Public (signature verified)

/api/v1/identity/my-qr               GET     Authenticated
/api/v1/identity/scan                POST    Volunteer / Admin
/api/v1/identity/validate/:payload   GET     Public (offline-safe)

/api/v1/matches                      GET     Public
/api/v1/matches/:id/score            PATCH   EventManager / Admin

/api/v1/announcements                GET     Public (filtered by role)
/api/v1/announcements                POST    Admin

/api/v1/leaderboard                  GET     Public
/api/v1/leaderboard/:eventId         GET     Public

/api/v1/admin/dashboard              GET     Admin
/api/v1/admin/users                  GET     Admin
/api/v1/admin/registrations/export   GET     Admin (CSV export)
```

### Standard Response Envelope

```bash
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 243
  },
  "timestamp": "2026-09-15T10:30:00Z"
}
{
  "success": false,
  "error": {
    "code": "REGISTRATION_DUPLICATE",
    "message": "Your team is already registered for Basketball (Men)",
    "details": []
  },
  "timestamp": "2026-09-15T10:30:00Z"
}
```

### Validation
All incoming DTOs use `class-validator` decorators. The global `ValidationPipe` with `whitelist: true, forbidNonWhitelisted: true` strips unknown properties and rejects malformed requests before they reach service layer.
* * *
## 10\. Frontend Architecture — Next.js
### Folder Structure

```php
apps/
└── web/                              # Next.js App Router
    ├── app/
    │   ├── (public)/                 # Route group — no auth required
    │   │   ├── page.tsx              # Landing page (SSG)
    │   │   ├── events/
    │   │   │   ├── page.tsx          # Events list (ISR, revalidate: 60s)
    │   │   │   └── [slug]/page.tsx   # Event detail (ISR)
    │   │   ├── schedule/page.tsx
    │   │   ├── leaderboard/page.tsx
    │   │   └── about/page.tsx
    │   │
    │   ├── (auth)/                   # Login / Register pages
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   │
    │   ├── (dashboard)/              # Authenticated — all CSR
    │   │   ├── layout.tsx            # Auth guard, sidebar/bottom nav
    │   │   ├── dashboard/page.tsx
    │   │   ├── my-registrations/page.tsx
    │   │   ├── my-team/page.tsx
    │   │   ├── my-qr/page.tsx        # QR code display with download
    │   │   └── profile/page.tsx
    │   │
    │   └── (admin)/                  # Admin portal
    │       ├── layout.tsx            # Admin role guard
    │       ├── admin/
    │       │   ├── dashboard/page.tsx
    │       │   ├── events/page.tsx
    │       │   ├── registrations/page.tsx
    │       │   ├── users/page.tsx
    │       │   ├── matches/page.tsx
    │       │   └── announcements/page.tsx
    │
    ├── components/
    │   ├── ui/                       # Primitive components (Button, Input, Badge)
    │   ├── layout/                   # Navbar, Footer, Sidebar, BottomNav
    │   ├── events/                   # EventCard, EventGrid, EventDetail
    │   ├── teams/                    # TeamCard, TeamMemberList
    │   ├── registrations/            # RegistrationFlow, PaymentModal
    │   ├── dashboard/                # StatCard, ActivityFeed
    │   ├── leaderboard/              # LeaderboardTable, PodiumDisplay
    │   └── realtime/                 # LiveScoreTicker, AnnouncementBanner
    │
    ├── lib/
    │   ├── api/                      # Typed API client (fetch wrappers)
    │   ├── hooks/                    # Custom React hooks
    │   ├── store/                    # Zustand stores
    │   └── utils/
    │
    ├── public/
    └── next.config.ts
```

### Rendering Strategy by Page

| Page | Strategy | Why |
| ---| ---| --- |
| Landing page | SSG | Never changes during the fest; fastest possible load |
| Events list | ISR (60s) | Updates when admin opens/closes registration |
| Event detail | ISR (60s) | Rule changes, venue updates |
| Schedule | ISR (30s) | Match times can be updated |
| Leaderboard | ISR (30s) + WebSocket | Base data static, updates streamed |
| Dashboard | CSR | Personalized, can't be server-rendered generically |
| Admin portal | CSR | Highly interactive, no SEO needed |

### State Management
**TanStack Query** handles all server state: fetching, caching, background refetch, error states, and optimistic updates. Example:

```dart
// Registrations list with auto-refetch
const { data, isLoading, error } = useQuery({
  queryKey: ['registrations', userId],
  queryFn: () => api.registrations.getMine(),
  staleTime: 30_000,  // 30s before background refetch
});
```

**Zustand** handles purely client-side state: theme preference, sidebar open/closed, notification tray open state. Nothing that needs to be synced with the server.
* * *
## 11\. Real-Time Systems
### WebSocket Architecture ([Socket.io](http://Socket.io) via NestJS Gateway)

```gherkin
Client                    NestJS Gateway               Redis Pub/Sub
  |                            |                            |
  |-- connect (JWT auth) ---→  |                            |
  |                            |-- join room: "global" --→  |
  |                            |-- join room: "event:{id}"  |
  |                            |                            |
  |                            |  ←-- publish: SCORE_UPDATE |
  |  ←-- emit: score_update -- |                            |
  |                            |                            |
  |                            |  ←-- publish: ANNOUNCEMENT |
  |  ←-- emit: announcement -- |                            |
```

**Why Redis Pub/Sub for WebSockets**: When you run multiple NestJS containers (horizontal scaling), a WebSocket connection is pinned to one server. Redis Pub/Sub acts as a message bus across all servers — so when Admin updates a score on Server A, it broadcasts to clients connected to Server B and C.
### Real-Time Events

| Event | Emitted By | Received By | Channel |
| ---| ---| ---| --- |
| `score_update` | EventManager via PATCH /matches/:id/score | All website visitors | `event:{eventId}` |
| `match_scheduled` | Admin via POST /matches | Registered participants | `event:{eventId}` |
| `announcement` | Admin via POST /announcements | All users | `global` |
| `registration_confirmed` | Payment webhook processor | Registering user | `user:{userId}` |
| `bracket_updated` | Admin bracket generation | Event participants | `event:{eventId}` |

* * *
## 12\. Background Job Architecture
### Queue Design

```yaml
┌───────────────────────────────────────────────────────────┐
│                     BullMQ + Redis                         │
│                                                            │
│  ┌─────────────────┐   ┌──────────────────┐              │
│  │  email-queue    │   │  payment-queue   │              │
│  │                 │   │                  │              │
│  │  Jobs:          │   │  Jobs:           │              │
│  │  - welcome      │   │  - verify        │              │
│  │  - confirmation │   │  - reconcile     │              │
│  │  - ticket-pdf   │   │  - refund-init   │              │
│  │  - password-rst │   │                  │              │
│  │                 │   │  Retries: 5      │              │
│  │  Retries: 3     │   │  Backoff: exp    │              │
│  └─────────────────┘   └──────────────────┘              │
│                                                            │
│  ┌─────────────────┐   ┌──────────────────┐              │
│  │   qr-queue      │   │  notif-queue     │              │
│  │                 │   │                  │              │
│  │  Jobs:          │   │  Jobs:           │              │
│  │  - generate-qr  │   │  - push-notif    │              │
│  │  - package-pdf  │   │  - in-app-notif  │              │
│  │  - upload-s3    │   │                  │              │
│  │                 │   │  Retries: 2      │              │
│  │  Retries: 3     │   └──────────────────┘              │
│  └─────────────────┘                                      │
└───────────────────────────────────────────────────────────┘
```

### Critical Rule: The Webhook Handler Must Be Minimal

```less
// CORRECT — webhook handler just validates and enqueues
@Post('webhooks/razorpay')
async handleRazorpayWebhook(@Body() body: any, @Headers() headers: any) {
  // 1. Verify signature — throws if invalid
  this.paymentsService.verifyWebhookSignature(headers['x-razorpay-signature'], body);

  // 2. Enqueue — returns immediately
  await this.paymentQueue.add('verify-payment', { orderId: body.payload.order.entity.id });

  // 3. Respond to Razorpay immediately
  return { status: 'received' };
}

// WRONG — doing DB work in webhook handler (causes timeouts, duplicate processing)
async handleRazorpayWebhook(@Body() body: any) {
  await this.prisma.transaction.update({ ... });        // ❌
  await this.prisma.registration.update({ ... });       // ❌
  await this.emailService.sendConfirmationEmail({ ... }); // ❌ 
}
```

* * *
## 13\. QR-Based Unified Identity System
### Architecture
Each registered participant gets one `QRIdentity` record. The QR code payload is a **signed JWT** containing:

```json
{
  "sub": "user-uuid",
  "name": "Rahul Sharma",
  "college": "NIT Patna",
  "role": "PARTICIPANT",
  "events": ["basketball-men", "chess-open"],
  "hasAccommodation": true,
  "hasProNightPass": false,
  "iat": 1726300800,
  "exp": 1726819200
}
```

The JWT is signed with a **separate QR signing secret** (not the auth secret). This means:
1. The payload is tamper-proof — scanners verify the signature without hitting the database
2. Works offline — a volunteer with the app can verify QRs without internet
3. Contains enough data for common scanning use cases (meal pickup, venue entry, match check-in)
### Scanning Workflow

```dart
Volunteer scans QR → App decodes JWT → Verify signature locally
                                      → If valid: show participant info
                                      → Log scan to server (async, best-effort)
                                      → If offline: buffer scan, sync when online
```

### QR Code Generation Flow

```verilog
Registration CONFIRMED event →
  qr-queue.add('generate-qr', { userId }) →
    Worker: create signed JWT payload →
    Generate QR image (qrcode library) →
    Upload to S3 →
    Update QRIdentity.qrImageUrl →
    Email PDF ticket to user (with QR embedded)
```

* * *
## 14\. Payment System Design
### Razorpay Integration Flow

```verilog
1. Client: POST /registrations (initiate)
   → Server creates Registration(PENDING_PAYMENT) + Transaction(INITIATED)
   → Server creates Razorpay Order → returns { orderId, amount, key }

2. Client: Opens Razorpay modal with orderId
   → User completes payment on Razorpay

3. Razorpay: POST /webhooks/razorpay (async, may arrive before step 4)
   → Verify signature → Enqueue payment-queue job

4. payment-queue worker:
   → Update Transaction(SUCCESS) + Registration(CONFIRMED)
   → Emit registration.confirmed event
   → Email queue → confirmation email
   → QR queue → generate QR identity

5. Client: Also sends POST /payments/verify (client-side callback)
   → Server checks if Transaction already SUCCESS (idempotent)
   → Returns current status to update UI
```

**Why both webhook and client callback?** The webhook is the authoritative source. The client callback is for UX — so the user sees their confirmation immediately. The webhook may arrive slightly later, so we check Transaction status rather than doing the update again.
### Idempotency
Every payment verification job checks `transaction.webhookVerified` before processing. If already `true`, it's a no-op. This prevents duplicate processing if Razorpay delivers the webhook twice.
* * *
## 15\. Caching Strategy
### Cache Layers

| Data | Cache Type | TTL | Invalidation |
| ---| ---| ---| --- |
| Event list | Redis + Next.js ISR | 60s / 60s | Admin update triggers `revalidatePath` + `redis.del` |
| Leaderboard | Redis | 30s | Match score update |
| User profile (read) | Redis | 5 min | Profile PATCH |
| Announcement list | Redis | 2 min | New announcement created |
| QR scan logs | Redis buffer | 5s batches | Write-through to PostgreSQL |
| Rate limit counters | Redis | Window-based | TTL expires automatically |

### Cache Invalidation Strategy
Use cache tags via a consistent key naming convention:
*   `event:{slug}` — invalidated when event is updated
*   `leaderboard:{eventId}` — invalidated when match score changes
*   `user:{id}:profile` — invalidated when user updates profile
*   `announcements:published` — invalidated when new announcement is published
* * *
## 16\. Security Hardening
### Input Validation & Sanitization
*   **NestJS ValidationPipe** with `whitelist: true` on all endpoints — strips undeclared fields
*   **Prisma parameterized queries** — SQL injection is structurally impossible
*   **React's JSX escaping** — XSS via user-generated content is prevented by default
*   Never render user input as `dangerouslySetInnerHTML`
### Rate Limiting

```sql
POST /auth/login         → 10 requests / 15 min per IP
POST /auth/register      → 5 requests / hour per IP
POST /auth/refresh       → 30 requests / hour per user
POST /registrations      → 20 requests / hour per user
POST /webhooks/razorpay  → No limit (but signature-verified)
GET  /events             → 200 requests / min per IP (public)
```

Implemented via `@nestjs/throttler` with Redis storage for distributed counters.
### Webhook Security

```cs
verifyWebhookSignature(signature: string, body: Buffer): void {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
    throw new UnauthorizedException('Invalid webhook signature');
  }
}
```

### Security Headers (NGINX)

```dart
add_header X-Frame-Options "DENY";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";
add_header Referrer-Policy "strict-origin-when-cross-origin";
add_header Permissions-Policy "geolocation=(), microphone=()";
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";
```

### Additional Security Measures
*   Passwords hashed with **bcrypt (rounds: 12)**
*   Refresh tokens stored as hashed values in Redis (not plaintext)
*   Admin panel at `/admin` behind additional IP allowlist in NGINX (optional for production fest)
*   Audit log for every sensitive action (role changes, payment status updates, QR scans by admin)
*   Environment variables validated at startup via **Joi schema** — app refuses to start with missing secrets
* * *
## 17\. Infrastructure & Deployment Architecture
### Production Architecture

```scss
Internet
    │
    ▼
Cloudflare (DNS + DDoS + CDN)
    │
    ▼
NGINX (Load Balancer + Reverse Proxy)      ← Single entry point
    │              │
    ▼              ▼
NestJS App     Next.js App
(Container A)  (Container B)
    │
    ├── PostgreSQL (Managed — Supabase or RDS)
    ├── Redis (Managed — Upstash or ElastiCache)
    └── AWS S3 (Object Storage)
```

### Container Setup

```yaml
# docker-compose.yml (production-equivalent)
services:
  api:
    build: ./apps/api
    environment:
      DATABASE_URL: ${DATABASE_URL}
      REDIS_URL: ${REDIS_URL}
      JWT_SECRET: ${JWT_SECRET}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  web:
    build: ./apps/web
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
      - web
```

### Environment Tiers

| Environment | Purpose | Deployment |
| ---| ---| --- |
| `local` | Developer machines | Docker Compose |
| `staging` | Feature testing, QA | Separate Railway/DigitalOcean app |
| `production` | Live fest | Primary server + managed DB |

### Infrastructure Budget Estimate (Annual)

| Service | Recommended | Monthly Cost |
| ---| ---| --- |
| App Server (2-4 vCPU, 4GB RAM) | DigitalOcean Droplet or Railway | ~$20–40 |
| Managed PostgreSQL | Supabase Free/Pro or DO Managed DB | $0–25 |
| Managed Redis | Upstash free tier (sufficient for this scale) | $0–10 |
| AWS S3 | Media storage (~50GB) | ~$2 |
| Cloudflare | Free tier (DDoS + CDN) | $0 |
| Total |  | ~$25–80/month |

For an IIT fest platform, this is extremely affordable. Supabase + Railway + Upstash as the stack costs near-zero for the traffic profile of Infinito.
* * *
## 18\. CI/CD Pipeline
### GitHub Actions Workflow

```yaml
# .github/workflows/ci.yml
name: CI Pipeline

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main]

jobs:
  validate:
    name: Lint, Type Check, Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run lint
      - run: npm run type-check
      - run: npm run test:unit

  integration-test:
    name: Integration Tests
    needs: validate
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: test }
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run prisma:migrate:test
      - run: npm run test:integration

  deploy:
    name: Deploy to Production
    needs: [validate, integration-test]
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Build Docker images
        run: docker build -t infinito-api ./apps/api
      - name: Push to registry
        run: docker push registry.example.com/infinito-api
      - name: Rolling deploy
        run: ./scripts/deploy.sh
```

### Branch Strategy

```css
main          ← Production-only. Deploys automatically.
develop       ← Integration branch. Deploys to staging.
feature/*     ← Individual features. PR → develop.
hotfix/*      ← Emergency fixes. PR → main directly, then backmerge.
```

* * *
## 19\. Monitoring, Observability & Alerting
### Observability Stack

| Tool | Purpose | Cost |
| ---| ---| --- |
| Sentry | Error tracking (frontend + backend) | Free tier sufficient |
| Better Uptime | Uptime monitoring + alerts | Free tier |
| Axiom / Logtail | Structured log ingestion & search | Free tier for this scale |
| Bull-Board | BullMQ queue visualization | Open source, self-hosted |
| pg\_stat\_statements | PostgreSQL slow query analysis | Built-in PostgreSQL |

### Structured Logging (NestJS)
Every log entry must include: `requestId`, `userId` (if authenticated), `module`, `action`, `durationMs`, `statusCode`. This enables filtering all logs for a single request or user in production.
### Critical Alerts to Configure
*   API error rate > 5% over 5 minutes → PagerDuty/Slack alert
*   Payment webhook failing (job in dead-letter queue) → Immediate Slack alert
*   Database connection pool exhaustion → Immediate alert
*   Response p99 > 2 seconds → Warning alert
*   Registration queue depth > 100 (processing lag) → Warning alert
*   Server disk usage > 80% → Warning
### Health Check Endpoint

```typescript
@Get('/health')
@Public()
async healthCheck() {
  const dbOk = await this.prisma.$queryRaw`SELECT 1`.then(() => true).catch(() => false);
  const redisOk = await this.redis.ping().then(r => r === 'PONG').catch(() => false);

  return {
    status: dbOk && redisOk ? 'healthy' : 'degraded',
    db: dbOk,
    redis: redisOk,
    uptime: process.uptime(),
    timestamp: new Date(),
  };
}
```

* * *
## 20\. Testing Strategy
### Test Pyramid

```erlang
         ┌───────────┐
         │  E2E (5%) │   Playwright: Full user journeys
         └─────┬─────┘
        ┌──────┴──────┐
        │Integration  │   Supertest + test DB: API contracts
        │   (30%)     │
        └──────┬──────┘
        ┌──────┴──────────────┐
        │   Unit Tests (65%)  │   Jest: Services, guards, utilities
        └─────────────────────┘
```

### Critical Test Cases
**Registration Engine**
*   Duplicate registration returns 409 Conflict
*   Team size below minimum returns 400
*   Team size above maximum returns 400
*   Closed event returns 400
*   Full event returns 400
*   Concurrent registrations (race condition) — only one succeeds
**Payment Processing**
*   Webhook with invalid signature returns 401
*   Webhook delivered twice → second is idempotent (no duplicate confirmation)
*   Payment verification before webhook arrival → returns PENDING status
**Authentication**
*   Expired access token → 401
*   Expired refresh token → 401 (re-login required)
*   Using revoked refresh token → 401
*   Role guard blocks insufficient-role user → 403
### Test Database Strategy
Maintain a separate PostgreSQL database for tests. Each integration test suite runs `prisma migrate reset` to get a clean state. This is fast enough (< 2s) for the schema size.
* * *
## 21\. UI/UX Design System
### Visual Identity
**Color Palette**

```scss
:root {
  /* Base */
  --color-bg-primary: #0a0a0f;       /* Near-black — default background */
  --color-bg-secondary: #111118;     /* Card backgrounds */
  --color-bg-elevated: #1a1a24;      /* Modal, overlay surfaces */

  /* Brand */
  --color-accent-primary: #e8501a;   /* Infinito orange — primary CTA */
  --color-accent-secondary: #0ea5e9; /* Electric blue — highlights, links */
  --color-accent-gold: #d4a017;      /* Gold — winner badges, leaderboard */

  /* Text */
  --color-text-primary: #f0f0f5;
  --color-text-secondary: #8888aa;
  --color-text-muted: #555570;

  /* Status */
  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;
}
```

**Typography**
*   Display headings: `Bebas Neue` or `Anton` — bold, wide, sports-feel
*   Body text: `DM Sans` — highly legible, modern
*   Monospace (scores, codes): `JetBrains Mono`
**Design Tokens applied consistently** via CSS custom properties and Tailwind theme extension. A designer changing `--color-accent-primary` updates every button, badge, and CTA globally.
### Key UX Flows
**Registration Flow (mobile-first, minimum taps)**

```java
Events List → Event Detail → "Register Now" →
  [If team event] Create/Join Team →
  Review Team Roster →
  Payment Summary →
  Razorpay Modal (native Razorpay) →
  Confirmation Screen + QR preview
```

Target: Complete registration in **under 4 minutes** on mobile.
**QR Identity Screen**
*   Full-screen QR display optimized for scanning distance
*   Auto-brightness boost when screen opens
*   One-tap PDF download for offline use
*   Shows: name, college, registered events summary, accommodation status
**Admin Dashboard Priorities**
*   Real-time registration count by event (no page refresh needed)
*   One-click event open/close toggle
*   Payment transaction table with reconciliation status
*   Live match score updater with instant WebSocket broadcast
### Component Principles
*   **Skeleton loaders** on every list and data fetch — never show blank space or spinners
*   **Optimistic UI** on actions with instant feedback — let the network confirm in the background
*   **Touch targets** minimum 44×44px for all interactive elements
*   **Bottom navigation** for mobile authenticated users (4 tabs: Home, Events, My QR, Profile)
*   **Error boundaries** around every dashboard widget — one failed widget doesn't crash the page
*   **Progressive loading** — show event cards immediately, fill in registration counts as they arrive
* * *
## 22\. Feature Prioritization Matrix
### P0 — Must Have for Launch (Block registration operations)
*   User authentication (register, login, Google OAuth, email verify)
*   Role management (RBAC, approval workflow for CA/Volunteer)
*   Dynamic event CRUD (admin creates sports, no code change required)
*   Team creation and joining (invite code workflow)
*   Registration engine (team + individual, capacity check, duplicate prevention)
*   Razorpay payment integration (order creation + webhook verification)
*   QR identity generation (post-payment)
*   Basic admin dashboard (registration counts, user management)
*   Email confirmations (BullMQ-backed, not synchronous)
*   Mobile-responsive frontend
### P1 — Required Before Fest Day (Block operational workflows)
*   QR scan validation system (volunteer-facing scan app / page)
*   Match scheduling (bracket creation, fixture publishing)
*   Live score updates (EventManager → WebSocket → all clients)
*   Announcement system (admin publishes → all users see)
*   Accommodation management (booking + confirmation)
*   Leaderboard (auto-computed from match results)
*   CA referral tracking and dashboard
*   Admin analytics (registration trends, revenue summary)
*   Payment reconciliation tools (failed/pending transactions report)
### P2 — Nice to Have (Post-launch if bandwidth permits)
*   Push notifications (web push API)
*   Pro Night pass distribution and validation
*   Merchandise tracking
*   Dispute/reporting system for match results
*   Media gallery (fest photos, admin uploads)
*   Sponsor showcase section
*   Emergency contact workflows
*   Export tools (CSV/PDF for registrations, payments)
### P3 — Future Roadmap (Infinito 2K27)
*   Native mobile apps (React Native)
*   AI-powered FAQ chatbot (schedule queries, rules questions)
*   Advanced bracket algorithms (Swiss, Round Robin)
*   Real-time match commentary feed
*   College performance analytics across years
* * *
## 23\. Engineering Timeline & Sprints
### 12-Week Plan (Assumes team of 4 engineers + 1 designer)

```yaml
SPRINT 1 — Weeks 1–2: Foundation
──────────────────────────────────
Backend:
  ✓ NestJS monorepo setup (Turborepo)
  ✓ Prisma schema + initial migration
  ✓ PrismaModule, ConfigModule, global error filter
  ✓ Swagger auto-documentation configured
  ✓ Docker Compose for local dev (NestJS + Next.js + PostgreSQL + Redis)

Frontend:
  ✓ Next.js App Router setup with TypeScript
  ✓ Tailwind + design tokens configured
  ✓ TanStack Query + Zustand wired
  ✓ Layout components: Navbar, Footer, BottomNav

Designer:
  ✓ Design tokens and component library in Figma
  ✓ Landing page + event list mockups
  ✓ Mobile registration flow mockups

──────────────────────────────────
SPRINT 2 — Weeks 3–4: Auth & Users
──────────────────────────────────
Backend:
  ✓ AuthModule: register, login, refresh, logout
  ✓ JWT strategy + refresh token rotation
  ✓ Google OAuth integration
  ✓ Role guards and RBAC decorators
  ✓ Email queue worker (welcome + verification emails)

Frontend:
  ✓ Login / Register pages
  ✓ Google OAuth button
  ✓ Profile page (view + edit)
  ✓ Auth context + protected route HOC

──────────────────────────────────
SPRINT 3 — Weeks 5–6: Events & Teams
──────────────────────────────────
Backend:
  ✓ EventsModule: CRUD (admin), list (public), open/close toggle
  ✓ TeamsModule: create, join via invite code, roster view, remove member
  ✓ Anti-duplicate team membership guard

Frontend:
  ✓ Events listing page (SSG/ISR)
  ✓ Event detail page
  ✓ Team creation flow
  ✓ Team join via invite link
  ✓ Team dashboard (captain view)

──────────────────────────────────
SPRINT 4 — Weeks 7–8: Registration & Payments
──────────────────────────────────
Backend:
  ✓ RegistrationModule: full registration engine
  ✓ PaymentsModule: Razorpay order creation
  ✓ Webhook handler + payment queue worker
  ✓ Post-payment: QR generation queue + email confirmation queue

Frontend:
  ✓ Registration flow (events → team → payment)
  ✓ Razorpay modal integration
  ✓ Confirmation screen + QR preview
  ✓ My Registrations page

──────────────────────────────────
SPRINT 5 — Weeks 9–10: Fest Operations
──────────────────────────────────
Backend:
  ✓ IdentityModule: QR scan API, scan logging
  ✓ MatchesModule: scheduling, score updates
  ✓ LeaderboardModule: computed from match results
  ✓ AnnouncementsModule
  ✓ WebSocket gateway: score updates + announcements
  ✓ AccommodationModule

Frontend:
  ✓ QR identity page (full-screen display)
  ✓ Volunteer QR scanner interface
  ✓ Live leaderboard page
  ✓ Schedule page
  ✓ Announcements feed with live ticker
  ✓ Admin portal: events, users, registrations management

──────────────────────────────────
SPRINT 6 — Weeks 11–12: Hardening
──────────────────────────────────
  ✓ Full E2E test suite (Playwright)
  ✓ Load testing (k6): simulate 1,000 concurrent registration attempts
  ✓ Security audit (OWASP checklist)
  ✓ CI/CD pipeline finalized
  ✓ Production deployment + monitoring configured
  ✓ Staging environment live
  ✓ Admin training session
  ✓ Runbook documentation
```

* * *
## 24\. Team Structure & Responsibilities
### Recommended Team

| Role | Count | Responsibilities |
| ---| ---| --- |
| Lead Architect | 1 | System design, PR reviews, infrastructure, security, database |
| Backend Engineer | 2 | NestJS modules, Prisma migrations, BullMQ workers, API testing |
| Frontend Engineer | 2 | Next.js pages, components, TanStack Query hooks, WebSocket client |
| UI/UX Designer | 1 | Figma system, design tokens, mobile flows, UX reviews |
| DevOps / Infra | 1 (can be Lead Architect) | Docker, CI/CD, monitoring, deployment |

### Decision Authority
*   **Architecture decisions** → Lead Architect (no debate by committee; document the decision in ADR format)
*   **Feature scope changes** → Lead Architect + Product Owner (fest coordinator)
*   **UI design deviations** → Designer approval required before implementation
*   **Production deployments** → Lead Architect approval + staging test required
### Onboarding Checklist for Each Engineer
1. Read this entire document
2. Local dev environment running via Docker Compose (< 30 min target)
3. Run existing tests, all passing
4. First PR: add a field to any DTO, write a test for it, submit PR
* * *
## 25\. Migration Strategy
### Recommendation: Clean Slate for 2K26
The current MongoDB dataset (user records, registrations) has structural inconsistencies from the per-sport schema design. Migrating this data into the new PostgreSQL schema would require:
*   Field mapping for 18+ different registration schemas
*   Resolving data integrity violations (orphaned team records, incomplete payments)
*   Re-hashing passwords (if bcrypt rounds differ)
**The clean-slate approach is strongly recommended** for the following reasons:
1. Infinito is an annual event — old registration data has no operational value for the new fest
2. Users will re-register anyway (new event, new teams, new payments)
3. Legacy data contamination causes debugging nightmares
**If migration is required (e.g., to preserve CA/Volunteer accounts):**

```cs
// One-off migration script
const oldUsers = await mongoClient.db('infinito').collection('users').find().toArray();

for (const oldUser of oldUsers) {
  await prisma.user.upsert({
    where: { email: oldUser.email },
    create: {
      email: oldUser.email,
      passwordHash: oldUser.password,   // Already hashed — keep as-is
      role: mapOldRole(oldUser.role),   // Map string to enum
      college: oldUser.college ?? null,
      isEmailVerified: oldUser.emailVerified ?? false,
    },
    update: {}  // Don't overwrite if already exists
  });
}
```

Run this script against the staging database first. Verify counts match. Then run against production with a maintenance window.
* * *
## 26\. Future Scaling Recommendations
### When to Scale (Triggers, Not Timelines)

| Metric | Current Target | Scale Trigger | Action |
| ---| ---| ---| --- |
| API p99 response time | < 500ms | Consistently > 1s | Horizontal scale API containers |
| Database CPU | < 50% | Consistently > 70% | Read replicas for analytics queries |
| Registration queue depth | < 50 | Consistently > 500 | Additional BullMQ workers |
| WebSocket connections | < 2,000 | \> 5,000 | Redis Cluster + dedicated WebSocket server |
| Concurrent users | < 3,000 | \> 10,000 | Move to Kubernetes |

### Infinito 2K27 Architecture Targets
**Extract the Registration Engine as a separate service** — This is the most traffic-intensive module during peak registration windows. A dedicated service with its own database connection pool, deployed independently, would allow it to scale without affecting auth and notification APIs.
**Consider GraphQL for the mobile client** — Once the API surface stabilizes, a GraphQL layer prevents over-fetching on mobile (critical for 3G/4G users from smaller colleges). Start with a thin Apollo Server that wraps existing NestJS services.
**Read Replicas** — Add a PostgreSQL read replica for leaderboard, schedule, and announcement queries. These are read-heavy and can tolerate 100–200ms replication lag.
**CDN-based QR generation** — Move QR code image generation to an edge function (Cloudflare Workers) to eliminate the BullMQ round-trip for the user waiting to see their QR.
* * *
## 27\. Common Pitfalls to Avoid
### Architecture Mistakes

| Mistake | Why It Happens | Prevention |
| ---| ---| --- |
| Putting business logic in controllers | Easy to do, bad to undo | Enforce via PR reviews: controllers only call services |
| Sharing Prisma entities as API response DTOs | Laziness | Always define separate response DTOs, never expose internal models |
| Direct module-to-module service imports | Feels convenient | Use EventEmitter2 for cross-module communication |
| Skipping database transactions for multi-step writes | Not thinking about failures | Any operation touching 2+ tables uses `prisma.$transaction` |

### Operations Mistakes

| Mistake | Why It Happens | Prevention |
| ---| ---| --- |
| Running `prisma migrate dev` on production | Panic deploy | CI/CD only runs `prisma migrate deploy` in production |
| Storing secrets in `.env` committed to git | Carelessness | `.env` in `.gitignore` day one; use Railway/Doppler for secret management |
| No staging environment | "It's just a fest" mindset | Staging is non-negotiable; bugs caught in staging don't wake anyone up at 3am |
| Skipping load testing | No time | k6 basic load test takes 2 hours to write and saves the entire registration day |

### Fest Day Mistakes

| Mistake | Impact | Prevention |
| ---| ---| --- |
| Not having a runbook | Volunteers don't know what to do when the app is slow | Write a 1-page runbook: what to check, who to call, how to restart services |
| QR scanner requires internet | Venue WiFi goes down; no one can enter | Offline QR verification via local JWT signature check |
| Admin dashboard not mobile-friendly | Event managers are running around with phones | Admin pages must work on mobile — less beautiful is fine, functional is mandatory |
| No read-only announcement mode during fest | Emergency announcements | Announcements API should work even if payment service is down (separate, simple) |

* * *
> **Final Note for the Engineering Team**  
> Infinito is not just a website — it is the operational backbone of a fest that 1,200+ athletes travel from across India to attend. A registration failure during peak window, a payment that succeeds but isn't confirmed, or a QR code that doesn't scan at the venue entrance — these are not "bugs," they are incidents that directly affect real people who've paid real money and made real travel plans.  
> Build with that weight in mind. Test the unhappy paths harder than the happy paths. Write the runbook before the go-live. Have a rollback plan.  
> **The goal is not a beautiful codebase. The goal is a fest that runs without a hitch.**
* * *
_Document version: 1.0 | Last updated: May 2026 | Next review: Pre-launch audit (Sprint 6)_