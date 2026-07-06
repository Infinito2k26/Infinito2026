# Infinito 2K26 — Deployment & Infrastructure Requirements
## Document for College Administration / Budget Sanction

**Prepared by:** Development Team, Infinito 2K26  
**Prepared for:** IIT Patna Administration / Technical Committee  
**Date:** June 2026

---

## 1. Executive Summary

Infinito 2K26 is IIT Patna's annual sports fest platform serving approximately 2,000–2,500 participants. The platform handles public event pages, team registrations, online payments, QR-based volunteer check-in, live scores, and a Campus Ambassador referral program.

**Total Budget Requested: ₹20,000 – ₹22,000** for the full event lifecycle (roughly 5–6 months, development through post-fest). This covers cloud infrastructure (₹12,000) and one shared Claude Pro AI subscription for the development team (₹7,000–₹8,000).

---

## 2. Why Campus Servers Are Not Sufficient

IIT Patna has on-campus servers, but they are only reachable from inside the institute network (campus WiFi). This makes them unsuitable as the sole deployment because:

- Students from other colleges registering for events cannot access a campus-internal IP
- Campus Ambassadors driving registrations are by definition off-campus
- Razorpay sends payment confirmation webhooks from its own data centres — it cannot reach a private campus IP
- Email services, social API callbacks, and search engine crawlers also need a public URL

**A campus-server-only deployment would make the platform an intranet, not a public event website.**

The solution is straightforward: one small cloud server on a public IP. At our scale (2,000–2,500 users, not millions), this costs very little.

---

## 3. Scale Reality Check

At 2,000–2,500 participants:

| Metric | Estimate |
|--------|----------|
| Total registered users | ~3,000 (participants + CAs + volunteers + admins) |
| Peak concurrent users | 50–100 (registration deadlines, fest day) |
| Database size | < 200 MB |
| QR images stored | ~3,000 × ~30 KB = ~90 MB |
| Total emails sent | ~5,000–8,000 over the lifecycle |
| Total storage needed | < 2 GB |

A single 2 GB RAM VPS handles all of this comfortably. We do not need managed database clusters, auto-scaling, or enterprise CDN plans.

---

## 4. Recommended Stack (Minimal, Production-Ready)

### Single VPS — runs everything

The local development setup already uses Docker Compose to run the API, PostgreSQL, and Redis together. The exact same setup runs on a cloud VPS. No new tooling needed.

**Recommended: DigitalOcean Basic Droplet — 2 GB RAM, 2 vCPU, 60 GB SSD**
- Cost: **$12/month = ~₹1,008/month**
- Runs: NestJS API + PostgreSQL + Redis, all in Docker containers
- Includes: 2 TB outbound transfer/month (more than enough)
- Automatic weekly snapshots (backup): +$0.6/month

This single server handles our entire backend.

---

### Frontend Hosting

**Vercel Free Tier**
- Cost: **₹0**
- Deploys the Next.js frontend automatically on every GitHub push
- Global CDN, automatic HTTPS — zero configuration
- Free tier is fully adequate for a student/fest project

---

### CDN, DNS, and DDoS Protection

**Cloudflare Free**
- Cost: **₹0**
- Point our domain's DNS to Cloudflare — done in 5 minutes
- Provides global CDN, DDoS mitigation, and rate limiting at the edge
- Protects the VPS IP from being exposed directly

---

### Object Storage (QR images, uploaded proofs)

**Cloudflare R2 Free Tier**
- Cost: **₹0**
- Free: 10 GB storage + 1 million read operations/month
- We need < 2 GB — comfortably within free limits
- No egress fees (unlike AWS S3)

---

### Email Delivery (Registration confirmations, QR tickets, password resets)

**Resend Free Tier**
- Cost: **₹0**
- Free: 3,000 emails/month
- Our total email volume across the full lifecycle (~5,000–8,000) may exceed 3,000/month at peak
- If needed: upgrade to Resend paid at $20/month = ₹1,680 for one month only

---

### Domain

**Option A (preferred): Institute subdomain**
- `infinito.iitp.ac.in` or `infinito2k26.iitp.ac.in` — request from institute IT
- Cost: **₹0**

**Option B: Independent domain**
- `.in` domain (e.g., `infinito2k26.in`) from GoDaddy / Namecheap
- Cost: **~₹800–₹900/year**

SSL certificate: free via Let's Encrypt (auto-renews, included with Cloudflare/Vercel).

---

### Payment Gateway

**Razorpay**
- No setup fee, no monthly fee
- Transaction fee: **2% + GST per successful payment**
- This is a percentage of registration revenue, not an infrastructure cost
- KYC with institute bank account takes 2–4 weeks — start this early

---

### APIs for the CA Program (all free)

| API | Cost |
|-----|------|
| YouTube Data API v3 | Free — 10,000 requests/day |
| Twitter / X API v2 | Free tier — 500,000 reads/month |
| Instagram Graph API | Free (requires Facebook Developer account) |

No paid third-party API is required.

---

## 5. Cost Breakdown

### Monthly Running Cost (normal months)

| Component | Service | Monthly Cost (INR) |
|-----------|---------|-------------------|
| VPS (API + DB + Redis) | DigitalOcean 2GB Droplet | ₹1,008 |
| VPS snapshots (backup) | DigitalOcean | ₹50 |
| Frontend | Vercel Free | ₹0 |
| CDN + DNS + DDoS | Cloudflare Free | ₹0 |
| Object storage | Cloudflare R2 Free | ₹0 |
| Email | Resend Free (3k/month) | ₹0 |
| **Total/month** | | **~₹1,060** |

### One-Time Costs

| Item | Cost |
|------|------|
| Domain registration (.in) | ₹900/year |
| Razorpay KYC (no fee) | ₹0 |

### Fest Month Allowance (email volume may exceed free tier)

| Item | Cost |
|------|------|
| Resend paid (one month) | ₹1,680 |

---

## 6. Full Lifecycle Budget

### Infrastructure Costs

| Period | Duration | Monthly Cost | Total |
|--------|----------|-------------|-------|
| Development / Staging | 2 months | ₹1,060 | ₹2,120 |
| Pre-registration + CA program | 2 months | ₹1,060 | ₹2,120 |
| Fest month (email upgrade) | 1 month | ₹2,740 | ₹2,740 |
| Post-fest (results, archive) | 1 month | ₹1,060 | ₹1,060 |
| Domain (1 year) | — | — | ₹900 |
| **Infrastructure Subtotal** | **6 months** | | **₹8,940** |

### AI Development Tooling

| Item | Duration | Monthly Cost | Total |
|------|----------|-------------|-------|
| Claude Pro (shared account) | 4 months | ₹1,680 | ₹6,720 |
| **AI Tooling Subtotal** | | | **₹6,720** |

### Combined Budget

| Category | Amount |
|----------|--------|
| Infrastructure | ₹8,940 |
| AI Development Tooling | ₹6,720 |
| **Subtotal** | **₹15,660** |
| Contingency buffer (25%) | ₹3,915 |
| **Recommended Sanction** | **₹19,575** |

**We are requesting a round figure of ₹20,000** to cover all infrastructure and development tooling costs for the full event lifecycle with buffer.

---

## 7. AI Development Tooling

### Claude Pro — Shared Team Subscription

Modern software projects of this complexity benefit significantly from AI coding assistance. The team will use a shared **Claude Pro** subscription (by Anthropic) during the active development phase.

Claude Pro assists with:
- Writing and reviewing backend API code (NestJS, Prisma, PostgreSQL queries)
- Generating boilerplate, test cases, and database migrations
- Debugging complex logic (payment flows, QR generation, BullMQ workers)
- Code review and catching security issues before they reach production
- Drafting technical documentation

| Plan | Cost | Why This Plan |
|------|------|---------------|
| Claude Free | ₹0 | Usage limits hit quickly; not viable for active development |
| **Claude Pro (Recommended)** | **$20/month = ₹1,680/month** | Sufficient for a shared team account; higher usage limits, access to latest models |
| Claude Team | $30/user/month (min. 5 seats) | Designed for larger organisations; overkill and significantly more expensive |

**One shared Claude Pro account** across the core development team is the most cost-effective approach.

**Duration:** Active development phases only — approximately 4 months (Development + Pre-registration phases).

| Item | Calculation | Cost |
|------|-------------|------|
| Claude Pro shared account | ₹1,680 × 4 months | ₹6,720 |

---

## 8. What This Budget Does Not Cover

| Item | Note |
|------|------|
| Razorpay transaction fees | Recovered from registration revenue (2% per transaction) |
| All social media APIs | Free — no cost |
| GitHub (source control, CI/CD) | Free for student/open-source organisations |
| Developer tools and IDEs | Free |

---

## 8. Summary for Administration

The Infinito 2K26 platform requires cloud hosting because campus servers are not publicly accessible, and a public URL is required for registrations, payments, and the Campus Ambassador program.

At our scale of 2,000–2,500 participants, **a single ₹1,000/month cloud server is sufficient** to run the entire backend. Combined with free-tier services for the frontend, CDN, storage, and email, the total infrastructure cost is approximately **₹1,000–₹1,700/month**.

We request a sanction of **₹20,000** to cover 6 months of infrastructure and a shared AI development tool subscription, including a contingency buffer. The AI subscription (Claude Pro at ₹1,680/month) directly reduces development time and the risk of shipping bugs in payment and registration flows — areas where errors have real financial consequences.

---

*Prepared by the Infinito 2K26 technical team.*  
*Contact: mdminhaju897866@gmail.com*
