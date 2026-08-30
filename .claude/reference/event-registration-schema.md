# Infinito 2K25 — Event Registration Forms: Complete Field Inventory
> Source: 19 Google Forms inspected live via browser automation (June 2026)
> Purpose: Comprehensive schema design reference for Infinito 2K26 platform

---

## Notation

| Symbol | Meaning |
|--------|---------|
| `*` | Required field |
| `radio` | Single-select radio group |
| `checkbox` | Multi-select checkbox group |
| `file` | File upload |
| `text` | Short text input |
| `textarea` | Long text / paragraph |
| `email` | Email input (validated) |
| `tel` | Phone number input |

---

## Common Patterns Across All Team Events

Most team-sport forms share a consistent 3–4 page structure:

| Page | Section | Fields |
|------|---------|--------|
| 1 | Team Identity | Email, College Name, Address, Captain, Vice-Captain, Captain Mobile, Vice-Captain Mobile |
| 2 | Player Roster | Player names (required + optional), Coach (Yes/No), Coach Name, Coach Contact |
| 3 | Accommodation | Do you wish to avail accommodation & meals? (Yes/No) |
| 4 | Payment | Payment Screenshot (file upload), Transaction ID, Any Queries |

Accommodation pricing (standard): **Rs 250/day (accommodation) + Rs 240/day (food) per head**. Opting in triggers welcome-kit eligibility.

---

## Event 1 — Cricket

**Form Title:** Cricket Registration Form - Infinito 2K25
**Type:** Team
**Gender:** Open (mixed registration)
**Registration Fee:** Rs. 6,500/- per team
**Prize Pool:** Up to Rs. 50,000/-
**Point of Contact:** Ankit Singh (9508830291), K Ayush (7979844511), Akshay Kumar (7013167821)
**Pages:** 3

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | Google account auto-filled |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC for all communications |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Section

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 1 Name | `text` | Yes | Captain |
| Player 2 Name | `text` | Yes | Vice Captain |
| Player 3 Name | `text` | Yes | |
| Player 4 Name | `text` | Yes | |
| Player 5 Name | `text` | Yes | |
| Player 6 Name | `text` | Yes | |
| Player 7 Name | `text` | Yes | |
| Player 8 Name | `text` | Yes | |
| Player 9 Name | `text` | Yes | |
| Player 10 Name | `text` | Yes | |
| Player 11 Name | `text` | Yes | |
| Player 12 Name | `text` | No | |
| Player 13 Name | `text` | No | |
| Player 14 Name | `text` | No | |
| Any Other Player Name | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Payment Section

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB; fee = Rs 6500 + optional accommodation surcharge |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 2 — Football

**Form Title:** Football Registration Form - Infinito 2k25
**Type:** Team
**Gender:** Separate categories (Men / Women) — same form
**Registration Fee:** Boys Rs. 6,500/- | Girls Rs. 3,000/- per team
**Prize Pool:** Boys up to Rs. 30,000 | Girls up to Rs. 15,000
**Point of Contact:** Chandra Mohan (7849892436), Devyansh (9198333486), Ishaan (8917001188)
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Men / Women | `radio` | Yes | Options: Men / Women |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC for all communications |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Roster

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Captain = P1, Vice = P2 (from Page 1) |
| Player 4 | `text` | Yes | |
| Player 5 | `text` | Yes | |
| Player 6 | `text` | Yes | |
| Player 7 | `text` | Yes | |
| Player 8 | `text` | Yes | |
| Player 9 | `text` | Yes | |
| Player 10 | `text` | Yes | |
| Player 11 | `text` | Yes | |
| Player 12 | `text` | No | |
| Player 13 | `text` | No | |
| Player 14 | `text` | No | |
| Player 15 | `text` | No | |
| Player 16 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No; surcharge = Rs 490/player/day |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB; transaction ID must be visible |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 3 — Basketball

**Form Title:** Basketball Registration Form - Infinito 2k25
**Type:** Team
**Gender:** Separate categories (Men / Women) — same form
**Registration Fee:** Boys Rs. 4,800/- | Girls Rs. 4,200/- per team
**Prize Pool:** Boys up to Rs. 25,000 | Girls up to Rs. 20,000
**Point of Contact:** Piyush Kumar (8000101831), Priyam (9875612746)
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Men / Women | `radio` | Yes | Options: Men / Women |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Roster

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Captain = P1, Vice = P2 |
| Player 4 | `text` | Yes | |
| Player 5 | `text` | Yes | |
| Substitute 1 | `text` | No | |
| Substitute 2 | `text` | No | |
| Substitute 3 | `text` | No | |
| Substitute 4 | `text` | No | |
| Substitute 5 | `text` | No | |
| Substitute 6 | `text` | No | |
| Substitute 7 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 4 — Badminton (Boys)

**Form Title:** Badminton Boys Registration Form - Infinito 2k25
**Type:** Team
**Gender:** Men (gender-optional radio on form)
**Registration Fee:** Rs. 2,500/- per team
**Prize Pool:** Up to Rs. 20,000
**Point of Contact:** Vijendra (8239919115), Parth (8459091758), Kunal (8941811159)
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Men / Women | `radio` | Yes | Options: Men / Women |
| Name of College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Team Details

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Captain = P1, Vice = P2 |
| Player 4 | `text` | Yes | |
| Player 5 | `text` | Yes | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 5 — Badminton (Women's)

**Form Title:** Badminton Women's Registration Form - Infinito 2k25
**Type:** Team
**Gender:** Women only (no gender radio — gender-specific form)
**Registration Fee:** Rs. 1,500/- per team
**Prize Pool:** Up to Rs. 15,000
**Point of Contact:** Vijendra (8239919115), Parth (8459091758), Kunal (8941811159)
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of College / Institution | `text` | Yes | No gender radio (women-only) |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Team Details

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Only 1 additional required (smaller team) |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 6 — Lawn Tennis (Boys)

**Form Title:** Lawn Tennis Boys Registration Form - Infinito 2k25
**Type:** Team (Doubles/Pair-based)
**Gender:** Boys only (gender-specific form)
**Registration Fee:** Rs. 1,000/- per team
**Prize Pool:** Up to Rs. 8,000/-
**Point of Contact:** Himanshu Shekhar C (9108238522), Raunak (6206979787)
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of College / Institution | `text` | Yes | |
| Address of College / Institution | `text` | Yes | |
| Contact Number | `tel` | Yes | Preferably WhatsApp; no captain/vice-captain split |

### Page 2 — Player & Coach Details

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 1 | `text` | Yes | |
| Player 2 | `text` | Yes | |
| Player 3 | `text` | No | |
| Player 4 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 7 — Lawn Tennis (Girls)

**Form Title:** Lawn Tennis Girls Registration Form - Infinito 2k25
**Type:** Team (Doubles/Pair-based)
**Gender:** Girls only (gender-specific form)
**Registration Fee:** Rs. 800/- per team
**Prize Pool:** Up to Rs. 6,000
**Point of Contact:** Himanshu Shekhar C (9108238522), Raunak (6206979787)
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of College / Institution | `text` | Yes | |
| Address of College / Institution | `text` | Yes | |
| Contact Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player & Coach Details

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 1 | `text` | Yes | |
| Player 2 | `text` | Yes | |
| Player 3 | `text` | No | |
| Player 4 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 8 — Mr. Infinito (Body Show Competition)

**Form Title:** Mr. Infinito Registration
**Type:** Individual
**Gender:** Men (implied — "Mr. Infinito")
**Registration Fee:** Rs. 599/- per head
**Prize Pool:** Not specified (prizes mentioned)
**Event Date:** 5th October @ IIT Patna Gymkhana
**Point of Contact:** Not specified on form
**Pages:** 1 (single-page form — no accommodation, no coach)

### Page 1 — All Fields

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Name | `text` | Yes | Individual participant |
| Mobile No. | `tel` | Yes | |
| Roll No. | `text` | Yes | Student ID |
| Your College | `text` | Yes | |
| College ID | `text` | Yes | ID number |
| College Address | `text` | Yes | |
| Payment Screenshot | `file` | Yes | IIT Patna students may upload ID card instead |
| Any Queries? | `textarea` | No | |

---

## Event 9 — Table Tennis (Boys)

**Form Title:** Table Tennis Boys Registration Form - Infinito 2K25
**Type:** Team
**Gender:** Boys only (gender-specific form)
**Registration Fee:** Rs. 1,500/-
**Prize Pool:** Up to Rs. 15,000/-
**Point of Contact:** Akshat Agrawal (7905554877), Shreya Yadav (8467935303)
**Pages:** 4
**Note:** Bring your own kit

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |

### Page 2 — Player Names

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Captain Name (Player 1) | `text` | Yes | |
| Captain Mobile No. | `tel` | Yes | |
| Player 2 | `text` | No | |
| Player 3 | `text` | No | |
| Player 4 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 10 — Table Tennis (Girls)

**Form Title:** Table Tennis Girls Registration Form - Infinito 2K25
**Type:** Team
**Gender:** Girls only (gender-specific form)
**Registration Fee:** Rs. 1,000/-
**Prize Pool:** Up to Rs. 10,000/-
**Point of Contact:** Akshat Agrawal (7905554877), Shreya Yadav (8467935303)
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |

### Page 2 — Player Names

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Captain Name (Player 1) | `text` | Yes | |
| Captain Mobile No. | `tel` | Yes | |
| Player 2 | `text` | No | |
| Player 3 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 11 — Squash (Boys)

**Form Title:** Squash Boys Registration Form - Infinito 2025
**Type:** Team
**Gender:** Boys only (gender-specific form)
**Registration Fee:** Rs. 800/- per team
**Prize Pool:** Up to Rs. 8,000/-
**Point of Contact:** Not specified on form
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of College / Institution | `text` | Yes | |
| Address of College / Institution | `text` | Yes | |
| Contact Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player & Coach Details

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 1 | `text` | Yes | |
| Player 2 | `text` | Yes | |
| Player 3 | `text` | Yes | |
| Player 4 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 12 — Squash (Girls)

**Form Title:** Squash Girls Registration Form - Infinito 2025
**Type:** Team
**Gender:** Girls only (gender-specific form)
**Registration Fee:** Rs. 600/- per team
**Prize Pool:** Up to Rs. 5,000/-
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of College / Institution | `text` | Yes | |
| Address of College / Institution | `text` | Yes | |
| Contact Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player & Coach Details

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 1 | `text` | Yes | |
| Player 2 | `text` | Yes | |
| Player 3 | `text` | Yes | |
| Player 4 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 13 — Volleyball (Boys)

**Form Title:** Volleyball Registration Boys Form - Infinito 2k25
**Type:** Team
**Gender:** Separate categories (Men / Women) — same form
**Registration Fee:** Rs. 4,800/- per team
**Prize Pool:** Up to Rs. 25,000/-
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Men / Women | `radio` | Yes | Options: Men / Women |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Roster

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Captain = P1, Vice = P2 |
| Player 4 | `text` | Yes | |
| Player 5 | `text` | Yes | |
| Player 6 | `text` | No | |
| Substitute 1 | `text` | No | |
| Substitute 2 | `text` | No | |
| Substitute 3 | `text` | No | |
| Substitute 4 | `text` | No | |
| Substitute 5 | `text` | No | |
| Substitute 6 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 14 — Volleyball (Women's)

**Form Title:** Volleyball Women's Registration Form - Infinito 2k25
**Type:** Team
**Gender:** Women only (gender-specific form)
**Registration Fee:** Rs. 4,500/- per team
**Prize Pool:** Up to Rs. 15,000/-
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of the College / Institution | `text` | Yes | No gender radio (women-only form) |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Roster

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Captain = P1, Vice = P2 |
| Player 4 | `text` | Yes | |
| Player 5 | `text` | Yes | |
| Player 6 | `text` | Yes | |
| Substitute 1 | `text` | No | |
| Substitute 2 | `text` | No | |
| Substitute 3 | `text` | No | |
| Substitute 4 | `text` | No | |
| Substitute 5 | `text` | No | |
| Substitute 6 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 15 — Chess

**Form Title:** Chess Registration Form - Infinito 2K25
**Type:** Team (4–6 members, per-head fee)
**Gender:** Open (no gender distinction)
**Registration Fee:** Rs. 249/- per head
**Prize Pool:** Up to Rs. 5,000
**Pages:** 2 (no accommodation page, no coach section)

### Page 1 — Team & Player Details (all in one page)

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of College / Institution | `text` | Yes | |
| Address of College / Institution | `text` | Yes | |
| Number of Members in Your Team | `text` | Yes | Determines fee (249 × n) |
| Player 1 Name (Captain) | `text` | Yes | |
| Captain Mobile No. | `tel` | Yes | |
| Captain Email ID | `email` | Yes | Preferably institute ID |
| Player 2 Name | `text` | Yes | |
| Player 3 Name | `text` | Yes | |
| Player 4 Name | `text` | Yes | |
| Player 5 Name | `text` | No | |
| Player 6 Name | `text` | No | |
| Any Queries / Comments | `textarea` | No | |

### Page 2 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot / ID Card | `file` | Yes | IIT Patna students may use ID card |

---

## Event 16 — Powerlifting

**Form Title:** Powerlifting Registration Form - Infinito 2k25
**Type:** Team (small, likely pairs or individual-per-weight-class)
**Gender:** Open (no gender radio)
**Registration Fee:** Rs. 999/- per team
**Prize Pool:** Up to Rs. 10,000
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Contact Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Details

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Team Member | `text` | Yes | Single field — likely one participant or comma-separated list |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 17 — Athletics

**Form Title:** Athletics Registration Form - Infinito 2025
**Type:** Individual (per-head registration; relay team filled separately)
**Gender:** Male / Female — same form, gender-branched event list
**Registration Fee:** Rs. 700/- per head (covers 3 individual events + 2 relay events)
**Prize Pool:** Up to Rs. 50,000
**Point of Contact:** Prince (9506122970), Aayush Aryan (7992361126)
**Pages:** 8 (most complex form)

### Page 1 — Participant Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Email | `email` | Yes | |
| Name | `text` | Yes | Individual athlete |
| Male / Female | `radio` | Yes | Options: Male / Female; determines event list on Page 2 |
| Name of the College / Institution | `text` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| WhatsApp Number | `tel` | Yes | |
| Will the coach be accompanying the player? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 2 — Individual Event Selection (Men's section shown)

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Events (Choose any 3) | `checkbox` | Yes | Max 3 selections |

**Available Events:**
- 100m
- 200m
- 400m
- 800m
- 1500m
- 5000m
- Long Jump
- Discus Throw
- Shot Put

### Page 3 — Relay Event Selection

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Relay Events | `checkbox` | No | Choose up to 2 |

**Available Relay Events:**
- 4×100m
- 4×400m (Boys only)
- 4×100m Mixed

### Page 4 — 4×100m Relay Team Members

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 2 | `text` | No | Fill N/A if not chosen |
| Player 3 | `text` | No | |
| Player 4 | `text` | No | |

### Page 5 — 4×400m Relay Team Members

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 2 | `text` | No | Fill N/A if not chosen |
| Player 3 | `text` | No | |
| Player 4 | `text` | No | |

### Page 6 — 4×100m Mixed Relay Team Members

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 2 | `text` | No | Fill N/A if not chosen |
| Player 3 | `text` | No | |
| Player 4 | `text` | No | |

### Page 7 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 8 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 18 — Kabaddi (Boys)

**Form Title:** Kabaddi Boys Registration Form - Infinito 2K25
**Type:** Team
**Gender:** Boys only (gender-specific form)
**Registration Fee:** Rs. 4,000/- per team
**Prize Pool:** Up to Rs. 25,000/-
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Name of the College / Institution | `text` | Yes | Note: College before Email in this form |
| Email | `email` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Roster

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Captain = P1, Vice = P2 |
| Player 4 | `text` | Yes | |
| Player 5 | `text` | Yes | |
| Player 6 | `text` | Yes | |
| Player 7 | `text` | Yes | |
| Substitute 1 | `text` | No | |
| Substitute 2 | `text` | No | |
| Substitute 3 | `text` | No | |
| Substitute 4 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Event 19 — Kabaddi (Girls)

**Form Title:** Kabaddi Girls Registration Form - Infinito 2K25
**Type:** Team
**Gender:** Girls only (gender-specific form)
**Registration Fee:** Rs. 2,000/- per team
**Prize Pool:** Up to Rs. 10,000/-
**Pages:** 4

### Page 1 — Team Identity

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Name of the College / Institution | `text` | Yes | College before Email (same as Kabaddi Boys) |
| Email | `email` | Yes | |
| Address of the College / Institution | `text` | Yes | |
| Team Captain Name | `text` | Yes | PoC |
| Team Vice Captain Name | `text` | Yes | |
| Team Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |
| Team Vice Captain Mobile Number | `tel` | Yes | Preferably WhatsApp |

### Page 2 — Player Roster

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Player 3 | `text` | Yes | Captain = P1, Vice = P2 |
| Player 4 | `text` | Yes | |
| Player 5 | `text` | Yes | |
| Player 6 | `text` | Yes | |
| Player 7 | `text` | Yes | |
| Substitute 1 | `text` | Yes | Required (unlike Boys where Sub 1 is optional) |
| Substitute 2 | `text` | No | |
| Substitute 3 | `text` | No | |
| Substitute 4 | `text` | No | |
| Will the coach be accompanying the players? | `radio` | Yes | Options: Yes / No |
| Name of the Coach (If Yes) | `text` | No | Conditional |
| Contact Number of the Coach (If Yes) | `tel` | No | Conditional |

### Page 3 — Accommodation

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Do you wish to avail accommodation and meal services? | `radio` | Yes | Options: Yes / No |

### Page 4 — Payment

| Field Label | Type | Required | Notes |
|-------------|------|----------|-------|
| Payment Screenshot | `file` | Yes | Max 10MB |
| Transaction ID | `text` | Yes | |
| Any Queries | `textarea` | No | |

---

## Cross-Event Summary Table

| # | Event | Type | Gender | Min Players | Max Players | Fee | Prize | Pages | Accommodation | Coach |
|---|-------|------|--------|-------------|-------------|-----|-------|-------|---------------|-------|
| 1 | Cricket | Team | Open | 11 | 15+ | Rs 6,500 | Rs 50,000 | 3 | No | Yes/No |
| 2 | Football | Team | Men/Women | 11 | 16 | Rs 6,500 / Rs 3,000 | Rs 30,000 / Rs 15,000 | 4 | Yes | Yes/No |
| 3 | Basketball | Team | Men/Women | 5 | 12 | Rs 4,800 / Rs 4,200 | Rs 25,000 / Rs 20,000 | 4 | Yes | Yes/No |
| 4 | Badminton Boys | Team | Men | 5 | 5 | Rs 2,500 | Rs 20,000 | 4 | Yes | Yes/No |
| 5 | Badminton Women's | Team | Women | 3 | 3 | Rs 1,500 | Rs 15,000 | 4 | Yes | Yes/No |
| 6 | Lawn Tennis Boys | Team | Boys | 2 | 4 | Rs 1,000 | Rs 8,000 | 4 | Yes | Yes/No |
| 7 | Lawn Tennis Girls | Team | Girls | 2 | 4 | Rs 800 | Rs 6,000 | 4 | Yes | Yes/No |
| 8 | Mr. Infinito | Individual | Men | 1 | 1 | Rs 599 | TBD | 1 | No | No |
| 9 | Table Tennis Boys | Team | Boys | 2 | 4 | Rs 1,500 | Rs 15,000 | 4 | Yes | Yes/No |
| 10 | Table Tennis Girls | Team | Girls | 2 | 3 | Rs 1,000 | Rs 10,000 | 4 | Yes | Yes/No |
| 11 | Squash Boys | Team | Boys | 3 | 4 | Rs 800 | Rs 8,000 | 4 | Yes | Yes/No |
| 12 | Squash Girls | Team | Girls | 3 | 4 | Rs 600 | Rs 5,000 | 4 | Yes | Yes/No |
| 13 | Volleyball Boys | Team | Men/Women | 5 | 11 | Rs 4,800 | Rs 25,000 | 4 | Yes | Yes/No |
| 14 | Volleyball Women's | Team | Women | 6 | 12 | Rs 4,500 | Rs 15,000 | 4 | Yes | Yes/No |
| 15 | Chess | Team | Open | 4 | 6 | Rs 249/head | Rs 5,000 | 2 | No | No |
| 16 | Powerlifting | Team/Ind | Open | 1 | 1+ | Rs 999 | Rs 10,000 | 4 | Yes | Yes/No |
| 17 | Athletics | Individual | Male/Female | 1 | 1 | Rs 700/head | Rs 50,000 | 8 | Yes | Yes/No |
| 18 | Kabaddi Boys | Team | Boys | 7 | 11 | Rs 4,000 | Rs 25,000 | 4 | Yes | Yes/No |
| 19 | Kabaddi Girls | Team | Girls | 7 | 12 | Rs 2,000 | Rs 10,000 | 4 | Yes | Yes/No |

---

## Schema Design Recommendations

### Core Entities

#### `Event`
```
id, name, sport, gender_category (OPEN|MEN|WOMEN|BOYS|GIRLS|MIXED),
type (INDIVIDUAL|TEAM), registration_fee, prize_pool,
min_players, max_players, max_substitutes,
has_accommodation, has_coach_option,
form_url, poc_name, poc_phone, rulebook_url
```

#### `Team` (for team events)
```
id, event_id, college_name, college_address, captain_name,
captain_phone, vice_captain_name, vice_captain_phone,
email, gender (MEN|WOMEN), accommodation_opted (bool),
payment_screenshot_url, transaction_id, queries,
created_at, status (PENDING|VERIFIED|REJECTED)
```

#### `TeamPlayer`
```
id, team_id, name, player_number (1..N), role (CAPTAIN|VICE_CAPTAIN|PLAYER|SUBSTITUTE),
is_required (bool)
```

#### `Coach`
```
id, team_id (or registration_id), name, phone, is_accompanying (bool)
```

#### `IndividualRegistration` (for Mr. Infinito, Athletics, Chess per-head)
```
id, event_id, name, email, phone, college, college_address,
roll_no (Mr. Infinito), college_id (Mr. Infinito),
gender (Male|Female) (Athletics),
accommodation_opted (bool), payment_screenshot_url,
transaction_id, queries, created_at, status
```

#### `AthleticsEventSelection`
```
id, registration_id, event_name (100m|200m|400m|800m|1500m|5000m|LongJump|DiscusThrow|ShotPut),
is_relay (bool), relay_type (4x100|4x400|4x100Mixed)
```

#### `AthleticsRelayTeam`
```
id, registration_id, relay_type, player2_name, player3_name, player4_name
```

#### `Payment`
```
id, registration_id, registration_type (TEAM|INDIVIDUAL),
screenshot_url, transaction_id, amount, verified_at
```

#### `AccommodationBooking`
```
id, registration_id, registration_type, num_days, num_persons,
total_amount (490 × persons × days), welcome_kit_eligible (bool)
```

### Key Schema Notes

1. **Cricket is the only form without an explicit accommodation page** — fee includes a flat Rs 6,500 with optional add-on calculated externally.
2. **Chess uses per-head pricing** — fee = 249 × `num_members`; payment collected once per team.
3. **Athletics is the most complex** — individual registration, gender-branched event list, relay teams as sub-registrations, 8-page form.
4. **Kabaddi Girls requires Substitute 1** (unlike Boys where all substitutes are optional) — schema must enforce `is_required` at the sport+gender level, not globally.
5. **Mr. Infinito** uses `roll_no` + `college_id` instead of captain/vice-captain structure — unique to this event.
6. **Table Tennis Boys has a captain mobile field on player page** while most other sports collect contact on Page 1 — normalize into the `Team` entity at the platform level.
7. **Gender tagging**: some forms have a shared Men/Women radio (Football, Basketball, Volleyball Boys, Badminton Boys); others are fully gender-specific forms with no radio (Badminton Women's, Volleyball Women's, Lawn Tennis Boys/Girls, Table Tennis Boys/Girls, Squash Boys/Girls, Kabaddi Boys/Girls).
