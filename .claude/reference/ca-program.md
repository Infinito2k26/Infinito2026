# Campus Ambassador Program — Technical Reference

> **Status:** Planning (pre-implementation)
> **Last updated:** 2026-06-12
> **Owner:** Lead / Architect (mdminhaj-2106)

---

## 1. Context and Shift From Previous Years

In previous editions, registrations were driven primarily by the internal team calling people directly. This year the CA program is **sponsor-funded**, which changes two things:

1. Scale — CAs are the primary registration driver, not the team.
2. Dual task authority — CA tasks come from **two sources**: Event Moderators/Managers AND Brands (sponsors). Both contribute to reward points and leaderboard ranking.

The system must support both task sources cleanly, track output with minimal manual verification, and handle traffic spikes when a CA shares a link that goes viral in a college group.

---

## 2. Core System Components

### 2.1 CA Onboarding

Every CA gets, at onboarding:
- A unique referral code (e.g., `CA0042`)
- A unique referral link (e.g., `infinito.in/register?ref=CA0042`)
- Access to their personal dashboard showing tasks, stats, leaderboard rank, and rewards

### 2.2 Dual Task System

Tasks are assigned from two authorities:

| Authority | Examples | Reward Weight |
|-----------|----------|---------------|
| Event Moderator / Manager | Go to X campus, post on Instagram, create WhatsApp group, host info-session | Configurable per task |
| Brand / Sponsor | Post about Brand X product, share Brand X promo code, create content featuring Brand Y | Configurable per task, may include brand-specific bonus |

Both task types live in the same task model. A `taskSource` enum distinguishes them (`MODERATOR` | `BRAND`). Brands are scoped to a brand entity so multiple sponsors can coexist.

### 2.3 Task Categories

| Category | Verification Method | Notes |
|----------|--------------------|----|
| Referral / Registration Drive | Server-side (automatic) | UTM tracking, zero API dependency |
| Instagram post / story | Instagram Graph API (OAuth) | Requires one-time CA account connect |
| Twitter/X post | X API v2 (app-level) | No CA OAuth needed for public metrics |
| YouTube video | YouTube Data API v3 (app-level) | No CA OAuth needed, free quota generous |
| LinkedIn post | LinkedIn API (OAuth) | Requires one-time CA account connect |
| WhatsApp / Telegram group | Manual submission + screenshot | No public API exists |
| Physical outreach (posters, classroom pitches, stalls) | Manual submission + photo proof | |
| TikTok | Manual submission + screenshot | Official API requires OAuth; skip for now |

### 2.4 Reward and Leaderboard System

Points are computed as:

```
total_points = SUM(task_points) + registration_points + bonus_points
```

Where:
- `task_points` = points assigned per completed task (set by moderator or brand)
- `registration_points` = `registrations_via_referral × points_per_registration` (configurable)
- `bonus_points` = milestone bonuses (e.g., first CA to 50 registrations)

Leaderboard is recalculated on a scheduled job (every 15 minutes via BullMQ) and cached in Redis. Do not query live from DB on every leaderboard page load.

---

## 3. Referral / UTM Tracking — Implementation

This is the highest-priority item and the backbone of the whole system.

### 3.1 How It Works

1. CA's unique `refCode` is stored in the `CampusAmbassador` table.
2. When someone visits `infinito.in/register?ref=CA0042`, the frontend reads the `ref` query param and stores it in a cookie/localStorage (30-day TTL).
3. On registration form submission, the frontend sends `refCode` in the payload.
4. The backend registration handler:
   - Creates the `Registration` row
   - Creates a `ReferralConversion` row linking the registration to the CA
   - Increments the CA's `referralCount` (in Redis, not a synchronous DB write — see scalability section)
5. A BullMQ job periodically flushes Redis counters to Postgres.

### 3.2 Attribution Edge Cases

| Scenario | Handling |
|----------|----------|
| Person clicks link, closes tab, registers 2 days later | Cookie/localStorage preserves refCode for 30 days |
| Person clicks two different CA links | Last-click attribution — whichever link they clicked most recently wins |
| Person registers directly (no ref) | `refCode = null`, not attributed to any CA |
| Same person registers twice (duplicate check) | Dedup on email/phone at registration — second attempt returns existing record, no double-count |

### 3.3 Prisma Schema (additions needed)

```prisma
model CampusAmbassador {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id])
  refCode         String   @unique  // e.g. "CA0042"
  collegeId       String
  college         College  @relation(fields: [collegeId], references: [id])
  referralCount   Int      @default(0)  // periodically synced from Redis
  totalPoints     Int      @default(0)
  rank            Int?
  socialAccounts  CASocialAccount[]
  tasks           CATaskAssignment[]
  createdAt       DateTime @default(now())
}

model CASocialAccount {
  id           String   @id @default(cuid())
  caId         String
  ca           CampusAmbassador @relation(fields: [caId], references: [id])
  platform     SocialPlatform  // INSTAGRAM | TWITTER | YOUTUBE | LINKEDIN
  accountId    String          // platform's internal user/channel ID
  handle       String          // @username or channel name
  accessToken  String?         // encrypted; null if no OAuth needed (YouTube, Twitter app-level)
  tokenExpiry  DateTime?
  connectedAt  DateTime @default(now())

  @@unique([caId, platform])
}

model CaTask {
  id           String      @id @default(cuid())
  title        String
  description  String
  category     TaskCategory  // REFERRAL | SOCIAL_MEDIA | PHYSICAL | CONTENT | COMMUNITY
  source       TaskSource    // MODERATOR | BRAND
  brandId      String?
  brand        Brand?       @relation(fields: [brandId], references: [id])
  points       Int
  deadline     DateTime?
  proofType    ProofType    // AUTO | URL_SUBMISSION | SCREENSHOT | PHOTO
  assignments  CATaskAssignment[]
  createdAt    DateTime @default(now())
}

model CATaskAssignment {
  id           String           @id @default(cuid())
  caId         String
  ca           CampusAmbassador @relation(fields: [caId], references: [id])
  taskId       String
  task         CaTask           @relation(fields: [taskId], references: [id])
  status       TaskStatus       // PENDING | SUBMITTED | VERIFIED | REJECTED
  proofUrl     String?          // submitted URL or file path
  proofNote    String?
  fetchedStats Json?            // API-fetched metrics at time of verification
  pointsAwarded Int?
  submittedAt  DateTime?
  verifiedAt   DateTime?
  verifiedBy   String?          // admin userId
}

model ReferralConversion {
  id           String   @id @default(cuid())
  caId         String
  ca           CampusAmbassador @relation(fields: [caId], references: [id])
  registrationId String @unique
  registration Registration @relation(fields: [registrationId], references: [id])
  createdAt    DateTime @default(now())
}

enum SocialPlatform { INSTAGRAM TWITTER YOUTUBE LINKEDIN TIKTOK }
enum TaskSource     { MODERATOR BRAND }
enum TaskCategory   { REFERRAL SOCIAL_MEDIA PHYSICAL CONTENT COMMUNITY }
enum ProofType      { AUTO URL_SUBMISSION SCREENSHOT PHOTO }
enum TaskStatus     { PENDING SUBMITTED VERIFIED REJECTED }
```

---

## 4. Social Media API Integrations

### 4.1 YouTube Data API v3 — FREE, no CA OAuth

- **Cost:** Free — 10,000 units/day quota. One video stats lookup = 1 unit. Covers hundreds of lookups daily with room to spare.
- **Implementation:** CA submits YouTube video URL in the task form. Backend extracts video ID from URL, calls:

```
GET https://www.googleapis.com/youtube/v3/videos
  ?part=statistics
  &id={videoId}
  &key={YOUTUBE_API_KEY}
```

Returns: `viewCount`, `likeCount`, `commentCount`. Store in `CATaskAssignment.fetchedStats`.

- **Setup:** Create a Google Cloud project, enable YouTube Data API v3, generate a server API key (not OAuth). Takes ~10 minutes. **Free.**

### 4.2 Twitter / X API v2 — FREE tier sufficient for our volume

- **Cost:** Free tier — 500,000 reads/month (as of 2026). Enough for verifying CA tweet submissions.
- **What we can get app-level (no CA OAuth):** `retweet_count`, `reply_count`, `like_count`, `quote_count` on any public tweet.
- **What requires CA OAuth:** `impression_count` (views). This is optional — likes/RTs are sufficient for verification.
- **Implementation:** CA submits tweet URL. Backend extracts tweet ID, calls:

```
GET https://api.twitter.com/2/tweets/{id}?tweet.fields=public_metrics
Authorization: Bearer {APP_BEARER_TOKEN}
```

- **Setup:** Create a developer app on developer.twitter.com, get Bearer Token. **Free tier is sufficient.**

### 4.3 Instagram Graph API — FREE API, requires CA OAuth once

- **Cost:** API itself is free. Requires a Facebook Developer App (free to create).
- **What requires CA OAuth:** Everything. Instagram's Basic Display API was end-of-lifed December 2024. No public endpoint exists.
- **CA OAuth flow:**
  1. During CA onboarding, show "Connect Instagram" button.
  2. CA logs in via Facebook Login and grants `instagram_basic`, `instagram_manage_insights` scopes.
  3. Store encrypted access token in `CASocialAccount.accessToken`.
  4. On demand (or via a BullMQ daily job), fetch post/story metrics.
- **IMPORTANT:** Only works if the CA has an Instagram **Business or Creator** account (not personal). Add a note in CA onboarding instructions. If they have a personal account, the only option is manual screenshot submission.
- **Token expiry:** Long-lived tokens last 60 days. Set up a BullMQ cron job to refresh tokens before expiry.

### 4.4 LinkedIn API — FREE API, requires CA OAuth once

- **Cost:** Free for basic creator analytics.
- **CA OAuth flow:** Same pattern as Instagram. CA connects LinkedIn account via OAuth during onboarding.
- **Lower priority** — most students are more active on Instagram than LinkedIn. Implement after Instagram.

### 4.5 What We Are NOT Using

| Option | Why Not |
|--------|---------|
| Phyllo | ~$20K/year — enterprise pricing |
| Brandwatch / Sprout Social | Enterprise pricing, overkill |
| Data365 / scraping APIs | Violates platform ToS, legal risk for organizers |
| TikTok official API | Requires OAuth, complex approval; manual screenshot is simpler |

---

## 5. Admin / Moderator Dashboard — Features

### 5.1 CA Overview Panel

Per CA row:
- Name, college, referral code
- Registrations via referral link (live, Redis-backed)
- Tasks completed / total tasks
- Total points, leaderboard rank
- Social accounts connected (Instagram, LinkedIn, YouTube, Twitter checkmarks)

### 5.2 Task Verification Panel

When a CA submits a task:
- If `proofType = AUTO` (YouTube, Twitter/X): API stats are fetched automatically and shown to admin for one-click approval.
- If `proofType = URL_SUBMISSION` (Instagram with OAuth): API stats fetched on demand, shown alongside submitted URL.
- If `proofType = SCREENSHOT` or `PHOTO`: Admin sees the uploaded image, submitted URL (clickable), and approves/rejects manually.

Admin can override points before approving (useful if a task partially met the brief).

### 5.3 Brand Task Management

Brands/sponsors get a scoped login (or the lead manages it) to:
- Create brand tasks (title, description, points, deadline, proof type)
- See completion rates for their tasks
- See which CAs completed their tasks (for sponsor reporting)

### 5.4 Leaderboard

Public-facing leaderboard on the Infinito website and admin view:
- Sorted by total points descending
- Shows: rank, CA name, college, registrations driven, tasks completed, total points
- Recalculated every 15 minutes via BullMQ job, served from Redis cache

---

## 6. Scalability — Critical for Link-Share Traffic Spikes

This is the most important engineering concern. When a CA shares their link in a large WhatsApp group (200–500 people), a sudden burst of traffic hits the registration page simultaneously. The system must not hang or time out.

### 6.1 What Must Not Be a Synchronous DB Write on Every Click

**Referral click tracking** should NOT do a DB INSERT on every link click. Instead:

```
click event → increment Redis key `referral:clicks:{refCode}` (atomic INCR, ~0.1ms)
BullMQ job every 5 min → flush Redis counts to Postgres
```

**Referral conversion (registration)** DOES write to DB, but via a BullMQ queue:

```
registration form submit → enqueue job → return 200 immediately
job worker → write Registration + ReferralConversion in prisma.$transaction
```

### 6.2 Redis Caching Strategy

| Key Pattern | Value | TTL |
|-------------|-------|-----|
| `referral:clicks:{refCode}` | Integer (click count) | No TTL — flushed by job |
| `referral:conversions:{refCode}` | Integer (registration count) | No TTL — flushed by job |
| `leaderboard:snapshot` | JSON array of top N CAs | 15 min |
| `ca:stats:{caId}` | JSON of CA's current stats | 5 min |
| `social:token:{caId}:{platform}` | Encrypted access token | Until token expiry |

### 6.3 Instagram / LinkedIn API Rate Limit Handling

- Never call social APIs synchronously in a request handler.
- All social API calls go through BullMQ jobs with a `socialMediaQueue`.
- Rate limit errors → exponential backoff retry (BullMQ built-in).
- YouTube and Twitter/X have generous quotas and can be called more freely, but still queue them to avoid blocking requests.

### 6.4 Infrastructure Requirements

| Component | What It Handles | Cost |
|-----------|----------------|------|
| Redis (already provisioned via Docker) | Referral counters, leaderboard cache, social tokens | Free (self-hosted) |
| BullMQ (already used in API) | Registration jobs, social API fetch jobs, leaderboard recalc jobs | Free (uses Redis) |
| Postgres (already provisioned) | All persistent data | Free (self-hosted) |
| YouTube Data API v3 | Public video stats | Free (10k units/day) |
| X API v2 | Public tweet stats | Free tier (500k reads/month) |
| Meta Developer App | Instagram Graph API | Free app; no per-call cost |
| LinkedIn Developer App | LinkedIn Creator Analytics | Free app; no per-call cost |

**No paid third-party service is required for this system.** All APIs used are free tier or free to access with OAuth.

---

## 7. Implementation Priority

| Phase | What | Effort |
|-------|------|--------|
| 1 | Prisma schema additions (CA, tasks, referral tables) | 1 day |
| 2 | Referral link generation at CA onboarding | 0.5 day |
| 3 | UTM capture on frontend + submission in registration payload | 0.5 day |
| 4 | Redis referral counter + BullMQ flush job | 1 day |
| 5 | Task CRUD (moderator + brand task creation in admin) | 1.5 days |
| 6 | Task submission flow (CA side) + manual proof upload | 1 day |
| 7 | YouTube + Twitter/X API verification (auto-fetch on submission) | 1 day |
| 8 | Instagram OAuth connect + Graph API fetch job | 2 days |
| 9 | Leaderboard calculation job + Redis cache + public page | 1 day |
| 10 | Admin verification panel (approve/reject tasks, override points) | 1.5 days |
| 11 | Brand scoped login / brand task management | 1 day |
| 12 | LinkedIn OAuth + fetch job | 1 day |

**Total estimated effort:** ~13 developer-days.
Phase 1–4 are the critical path — implement these before CA onboarding begins.

---

## 8. Security Considerations

- Social media OAuth tokens must be **encrypted at rest** (use AES-256 via a KMS key or a project-level secret). Never store plain tokens in Postgres.
- Referral codes must not be guessable — use `cuid()` or a short random string, not sequential integers.
- Brand task creation must be gated behind a `BRAND` role — brands should not see other brands' task performance.
- Admin task verification panel must be gated behind `ADMIN` or `MODERATOR` role.
- Rate-limit the referral link endpoint at the CDN/nginx layer to prevent artificial click inflation (e.g., max 10 requests/second per IP).
