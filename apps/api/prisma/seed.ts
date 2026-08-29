import {
  PrismaClient,
  Prisma,
  UserRole,
  BroadCategory,
  EventRegistrationType,
  GenderCategory,
  FeeStructure,
  SubOptionType,
  ParticipantRole,
  IdentityType,
  RegistrationStatus,
  PaymentMode,
  PaymentStatus,
  ScanDirection,
  ScanResult,
  VerificationLevel,
  TaskSource,
  TaskCategory,
  ProofType,
  TaskStatus,
} from '@prisma/client';
import 'dotenv/config';



import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });


// bcrypt hash of "Infinito@dev123" with 10 salt rounds — FAKE, dev only.
const DEV_PASSWORD_HASH =
  '$2b$10$Fakehashabcdefghijklmnopqrstuvwxyz012345678901234567890';

// ---------------------------------------------------------------------------
// Fixed seed IDs — prefixed with "seed-" for easy identification and stable
// FK references across re-runs. UUIDs are valid v4 format required by @db.Uuid.
// ---------------------------------------------------------------------------
const IDS = {
  // Users
  userAdmin:        'a0000000-0000-0000-0000-000000000001',
  userModerator:    'a0000000-0000-0000-0000-000000000002',
  userVolunteer:    'a0000000-0000-0000-0000-000000000003',
  userCA:           'a0000000-0000-0000-0000-000000000004',
  userIITP:         'a0000000-0000-0000-0000-000000000005',
  userExternal:     'a0000000-0000-0000-0000-000000000006',

  // Events
  eventFootball:    'b0000000-0000-0000-0000-000000000001',
  eventBGMI:        'b0000000-0000-0000-0000-000000000002',
  eventAthletics:   'b0000000-0000-0000-0000-000000000003',

  // EventSubOptions (Athletics)
  subOption100m:    'c0000000-0000-0000-0000-000000000001',
  subOption4x100:   'c0000000-0000-0000-0000-000000000002',

  // Infinito 2K26 real event catalog (see .claude/reference/event-registration-schema.md)
  // — additive, does not touch eventFootball/eventBGMI/eventAthletics above.
  eventCricket:          'b0000000-0000-0000-0000-000000000004',
  eventFootball2k26:     'b0000000-0000-0000-0000-000000000005',
  eventBasketball:       'b0000000-0000-0000-0000-000000000006',
  eventBadmintonBoys:    'b0000000-0000-0000-0000-000000000007',
  eventBadmintonWomen:   'b0000000-0000-0000-0000-000000000008',
  eventLawnTennisBoys:   'b0000000-0000-0000-0000-000000000009',
  eventLawnTennisGirls:  'b0000000-0000-0000-0000-000000000010',
  eventMrInfinito:       'b0000000-0000-0000-0000-000000000011',
  eventTableTennisBoys:  'b0000000-0000-0000-0000-000000000012',
  eventTableTennisGirls: 'b0000000-0000-0000-0000-000000000013',
  eventSquashBoys:       'b0000000-0000-0000-0000-000000000014',
  eventSquashGirls:      'b0000000-0000-0000-0000-000000000015',
  eventVolleyballMen:    'b0000000-0000-0000-0000-000000000016',
  eventVolleyballWomen:  'b0000000-0000-0000-0000-000000000017',
  eventChess:            'b0000000-0000-0000-0000-000000000018',
  eventPowerlifting:     'b0000000-0000-0000-0000-000000000019',
  eventAthletics2k26:    'b0000000-0000-0000-0000-000000000020',
  eventKabaddiBoys:      'b0000000-0000-0000-0000-000000000021',
  eventKabaddiGirls:     'b0000000-0000-0000-0000-000000000022',

  // EventSubOptions — Athletics 2K26 (9 individual + 3 relay disciplines)
  subOpt200m:        'c0000000-0000-0000-0000-000000000003',
  subOpt400m:        'c0000000-0000-0000-0000-000000000004',
  subOpt800m:        'c0000000-0000-0000-0000-000000000005',
  subOpt1500m:       'c0000000-0000-0000-0000-000000000006',
  subOpt5000m:       'c0000000-0000-0000-0000-000000000007',
  subOptLongJump:    'c0000000-0000-0000-0000-000000000008',
  subOptDiscusThrow: 'c0000000-0000-0000-0000-000000000009',
  subOptShotPut:     'c0000000-0000-0000-0000-000000000010',
  subOpt100mV2:      'c0000000-0000-0000-0000-000000000011',
  subOpt4x100V2:     'c0000000-0000-0000-0000-000000000012',
  subOpt4x400V2:     'c0000000-0000-0000-0000-000000000013',
  subOpt4x100Mixed:  'c0000000-0000-0000-0000-000000000014',

  // SocialPlatformConfig
  platformIG:       'd0000000-0000-0000-0000-000000000001',
  platformYT:       'd0000000-0000-0000-0000-000000000002',
  platformTW:       'd0000000-0000-0000-0000-000000000003',
  platformLI:       'd0000000-0000-0000-0000-000000000004',

  // Brand
  brandSponsor:     'e0000000-0000-0000-0000-000000000001',

  // CaTask
  taskReferral:     'f0000000-0000-0000-0000-000000000001',

  // CAProfile
  caProfile:        '00000000-0000-0000-0000-000000000001',

  // Teams
  teamFootball:     '10000000-0000-0000-0000-000000000001',
  teamBGMI:         '10000000-0000-0000-0000-000000000002',

  // Participants — Football (3)
  partFB1:          '20000000-0000-0000-0000-000000000001',
  partFB2:          '20000000-0000-0000-0000-000000000002',
  partFB3:          '20000000-0000-0000-0000-000000000003',

  // Participants — BGMI (4)
  partBG1:          '20000000-0000-0000-0000-000000000004',
  partBG2:          '20000000-0000-0000-0000-000000000005',
  partBG3:          '20000000-0000-0000-0000-000000000006',
  partBG4:          '20000000-0000-0000-0000-000000000007',

  // Registrations
  regFootball:      '30000000-0000-0000-0000-000000000001',
  regBGMI:          '30000000-0000-0000-0000-000000000002',
  regAthletics:     '30000000-0000-0000-0000-000000000003',

  // RegistrationSubOptions
  regSubOpt1:       '40000000-0000-0000-0000-000000000001',
  regSubOpt2:       '40000000-0000-0000-0000-000000000002',

  // Payment
  paymentFootball:  '50000000-0000-0000-0000-000000000001',

  // Credentials
  credFB1:          '60000000-0000-0000-0000-000000000001',
  credFB2:          '60000000-0000-0000-0000-000000000002',
  credFB3:          '60000000-0000-0000-0000-000000000003',
  credIndividual:   '60000000-0000-0000-0000-000000000004',

  // CATaskAssignment
  taskAssignment:   '70000000-0000-0000-0000-000000000001',

  // SocialReferral
  socialReferral:   '80000000-0000-0000-0000-000000000001',

  // ReferralConversion
  referralConv:     '90000000-0000-0000-0000-000000000001',

  // ScanLog
  scanLog:          '01000000-0000-0000-0000-000000000001',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Upsert helper that uses a fixed id as the where clause. */
async function upsertById<T>(
  model: { upsert: (args: any) => Promise<T> },
  id: string,
  data: object,
): Promise<T> {
  return model.upsert({
    where: { id },
    update: {},
    create: { id, ...data },
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🌱  Infinito 2026 seed (database.md v2.2)\n');

  // =========================================================================
  // 1. USERS
  // =========================================================================
  console.log('👤  Seeding Users...');

  await prisma.user.upsert({
    where: { email: 'admin@infinito2k26.in' },
    update: {},
    create: {
      id: IDS.userAdmin,
      email: 'admin@infinito2k26.in',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Seed Super Admin',
      role: UserRole.SUPER_ADMIN,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'moderator@infinito2k26.in' },
    update: {},
    create: {
      id: IDS.userModerator,
      email: 'moderator@infinito2k26.in',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Seed Moderator',
      role: UserRole.MODERATOR,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'volunteer@infinito2k26.in' },
    update: {},
    create: {
      id: IDS.userVolunteer,
      email: 'volunteer@infinito2k26.in',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Seed Volunteer',
      role: UserRole.VOLUNTEER,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'ca@infinito2k26.in' },
    update: {},
    create: {
      id: IDS.userCA,
      email: 'ca@infinito2k26.in',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Seed Campus Ambassador',
      role: UserRole.CAMPUS_AMBASSADOR,
      college: 'Dev College, Mumbai',
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'iitp.participant@infinito2k26.in' },
    update: {},
    create: {
      id: IDS.userIITP,
      email: 'iitp.participant@infinito2k26.in',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Seed IITP Participant',
      role: UserRole.PARTICIPANT,
      college: 'IIT Patna',
      isIITP: true,
      iitpEmail: 'seed2026@iitp.ac.in',
      isIITPVerified: true,
      isEmailVerified: true,
    },
  });

  await prisma.user.upsert({
    where: { email: 'participant@infinito2k26.in' },
    update: {},
    create: {
      id: IDS.userExternal,
      email: 'participant@infinito2k26.in',
      passwordHash: DEV_PASSWORD_HASH,
      name: 'Seed External Participant',
      role: UserRole.PARTICIPANT,
      college: 'Dev University',
      isEmailVerified: true,
    },
  });

  console.log('   ✅  6 users created.\n');

  // =========================================================================
  // 2. SOCIAL PLATFORM CONFIG (4 defaults per v2.2 spec)
  // =========================================================================
  console.log('📡  Seeding SocialPlatformConfig...');

  await upsertById(prisma.socialPlatformConfig, IDS.platformIG, {
    slug: 'instagram',
    displayName: 'Instagram',
    isActive: true,
    oauthEnabled: true,
    canVerifyAction: false, // API cannot verify follows (removed 2018)
    oauthScopes: ['user_profile', 'user_media'],
    verifyEndpoint: null,
    metricsDef: [
      { key: 'followers', label: 'Followers', type: 'count' },
      { key: 'story_views', label: 'Story Views', type: 'count' },
    ],
    constraintsDef: [
      { field: 'followers', min: 500, label: 'Must have 500+ followers' },
    ],
    attributesDef: [
      { key: 'handle', label: 'Instagram Username', required: true },
      { key: 'profileUrl', label: 'Profile URL', required: false },
    ],
  });

  await upsertById(prisma.socialPlatformConfig, IDS.platformYT, {
    slug: 'youtube',
    displayName: 'YouTube',
    isActive: true,
    oauthEnabled: true,
    canVerifyAction: true, // subscriptions.list confirms subscribe after OAuth
    oauthScopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    verifyEndpoint: 'https://www.googleapis.com/youtube/v3/subscriptions',
    metricsDef: [
      { key: 'subscribers', label: 'Subscribers', type: 'count' },
      { key: 'views', label: 'Total Views', type: 'count' },
    ],
    constraintsDef: [
      { field: 'subscribers', min: 100, label: 'Must have 100+ subscribers' },
    ],
    attributesDef: [
      { key: 'channelId', label: 'Channel ID', required: true },
      { key: 'channelUrl', label: 'Channel URL', required: false },
    ],
  });

  await upsertById(prisma.socialPlatformConfig, IDS.platformTW, {
    slug: 'twitter',
    displayName: 'Twitter / X',
    isActive: true,
    oauthEnabled: true,
    canVerifyAction: true, // GET /2/users/:id/following confirms follow
    oauthScopes: ['tweet.read', 'users.read', 'follows.read'],
    verifyEndpoint: 'https://api.twitter.com/2/users/:id/following',
    metricsDef: [
      { key: 'followers', label: 'Followers', type: 'count' },
      { key: 'tweets', label: 'Tweet Count', type: 'count' },
    ],
    constraintsDef: [
      { field: 'followers', min: 200, label: 'Must have 200+ followers' },
    ],
    attributesDef: [
      { key: 'handle', label: 'Twitter Handle', required: true },
    ],
  });

  await upsertById(prisma.socialPlatformConfig, IDS.platformLI, {
    slug: 'linkedin',
    displayName: 'LinkedIn',
    isActive: true,
    oauthEnabled: true,
    canVerifyAction: false, // Connection status not available via API at launch
    oauthScopes: ['r_liteprofile', 'r_emailaddress'],
    verifyEndpoint: null,
    metricsDef: [
      { key: 'connections', label: 'Connections', type: 'count' },
    ],
    constraintsDef: [
      { field: 'connections', min: 100, label: 'Must have 100+ connections' },
    ],
    attributesDef: [
      { key: 'publicId', label: 'LinkedIn Public ID', required: true },
      { key: 'profileUrl', label: 'Profile URL', required: false },
    ],
  });

  console.log('   ✅  Instagram, YouTube, Twitter, LinkedIn created.\n');

  // =========================================================================
  // 3. BRAND
  // =========================================================================
  console.log('🏷️   Seeding Brand...');

  await upsertById(prisma.brand, IDS.brandSponsor, {
    name: 'Seed Sponsor Co.',
    logoUrl: 'https://placeholder.infinito2k26.in/seed-brand-logo.png',
    contactName: 'Dev Contact',
    contactEmail: 'sponsor@infinito2k26.in',
    isActive: true,
  });

  console.log('   ✅  1 brand created.\n');

  // =========================================================================
  // 4. EVENTS
  // =========================================================================
  console.log('🎪  Seeding Events...');

  // --- Football Men (OUTDOOR, TEAM, FLAT fee) ---
  await upsertById(prisma.event, IDS.eventFootball, {
    name: 'Football Men 2K26',
    slug: 'football-men-2k26',
    broadCategory: BroadCategory.OUTDOOR,
    sportCategory: 'Football',
    description: '11-a-side football tournament for male participants.',
    registrationType: EventRegistrationType.TEAM,
    genderCategory: GenderCategory.MEN,
    teamSizeMin: 11,
    teamSizeMax: 14,
    maxSubstitutes: 3,
    viceCaptainRequired: true,
    coachAllowed: true,
    feeStructure: FeeStructure.FLAT,
    feeFlat: 500.00,
    startDate: new Date('2026-09-15T08:00:00Z'),
    endDate: new Date('2026-09-17T18:00:00Z'),
    venue: 'IIT Patna Football Ground',
    hasAccommodation: true,
    accommodationRate: 490.00,
    prizePool: 20000.00,
    capacity: 32,
    isPublished: true,
    registrationOpen: true,
    customFieldsDef: [
      {
        label: 'Any special requirements?',
        inputType: 'TEXT',
        required: false,
        scope: 'TEAM',
      },
    ],
  });

  // --- BGMI (ESPORTS, TEAM, FLAT fee, PARTICIPANT custom fields) ---
  await upsertById(prisma.event, IDS.eventBGMI, {
    name: 'BGMI 2K26',
    slug: 'bgmi-2k26',
    broadCategory: BroadCategory.ESPORTS,
    sportCategory: 'BGMI',
    description: 'Battlegrounds Mobile India — squad tournament.',
    registrationType: EventRegistrationType.TEAM,
    genderCategory: GenderCategory.OPEN,
    teamSizeMin: 4,
    teamSizeMax: 5,
    maxSubstitutes: 1,
    viceCaptainRequired: false,
    coachAllowed: false,
    feeStructure: FeeStructure.FLAT,
    feeFlat: 200.00,
    startDate: new Date('2026-09-14T10:00:00Z'),
    venue: 'IIT Patna E-Sports Arena',
    hasAccommodation: false,
    prizePool: 15000.00,
    capacity: 64,
    isPublished: true,
    registrationOpen: true,
    customFieldsDef: [
      {
        label: 'In-Game Name',
        inputType: 'TEXT',
        required: true,
        scope: 'PARTICIPANT',
      },
      {
        label: 'BGMI ID',
        inputType: 'TEXT',
        required: true,
        scope: 'PARTICIPANT',
      },
    ],
  });

  // --- Athletics (OUTDOOR, INDIVIDUAL, with EventSubOptions) ---
  await upsertById(prisma.event, IDS.eventAthletics, {
    name: 'Athletics 2K26',
    slug: 'athletics-2k26',
    broadCategory: BroadCategory.OUTDOOR,
    sportCategory: 'Athletics',
    description: 'Track and field events. Select up to 3 individual + 2 relay disciplines.',
    registrationType: EventRegistrationType.INDIVIDUAL,
    genderCategory: GenderCategory.OPEN,
    teamSizeMin: null,
    teamSizeMax: null,
    maxSubstitutes: null,
    viceCaptainRequired: false,
    coachAllowed: false,
    feeStructure: FeeStructure.FLAT,
    feeFlat: 100.00,
    startDate: new Date('2026-09-16T07:00:00Z'),
    venue: 'IIT Patna Athletic Track',
    hasAccommodation: false,
    prizePool: 10000.00,
    isPublished: true,
    registrationOpen: true,
  });

  console.log('   ✅  Football, BGMI, Athletics events created.\n');

  // =========================================================================
  // 5. EVENT SUB OPTIONS (Athletics only)
  // =========================================================================
  console.log('🏃  Seeding EventSubOptions (Athletics)...');

  await upsertById(prisma.eventSubOption, IDS.subOption100m, {
    eventId: IDS.eventAthletics,
    name: '100m',
    type: SubOptionType.INDIVIDUAL,
    maxSelectionsPerReg: 3,
    isActive: true,
  });

  await upsertById(prisma.eventSubOption, IDS.subOption4x100, {
    eventId: IDS.eventAthletics,
    name: '4×100m Relay',
    type: SubOptionType.RELAY,
    maxSelectionsPerReg: 2,
    isActive: true,
  });

  console.log('   ✅  100m, 4×100m Relay sub-options created.\n');

  // =========================================================================
  // 5B. INFINITO 2K26 EVENT CATALOG
  // Real 19-event inventory reconstructed from the Infinito 2K25 Google Forms
  // (see .claude/reference/event-registration-schema.md). Purely additive —
  // does not touch eventFootball/eventBGMI/eventAthletics or their downstream
  // Team/Participant/Registration/Payment/Credential fixtures above.
  // =========================================================================
  console.log('  Seeding Infinito 2K26 event catalog (19 events)...');

  const STANDARD_ACCOMMODATION_RATE = 490.0; // Rs 250/day stay + Rs 240/day food, per head

  const infinito2k26Events: { id: string; data: Prisma.EventCreateInput }[] = [
    {
      id: IDS.eventCricket,
      data: {
        name: 'Cricket 2K26',
        slug: 'cricket-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Cricket',
        description: '11-a-side cricket tournament, open registration.',
        pointOfContactName: 'Ankit Singh / K Ayush / Akshay Kumar',
        pointOfContactPhone: '9508830291',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.OPEN,
        teamSizeMin: 11,
        teamSizeMax: 16,
        maxSubstitutes: 5,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 6500.0,
        startDate: new Date('2026-09-15T08:00:00Z'),
        venue: 'IIT Patna Cricket Ground',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 50000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventFootball2k26,
      data: {
        name: 'Football 2K26',
        slug: 'football-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Football',
        description: '11-a-side football tournament. One team roster per gender bracket.',
        pointOfContactName: 'Chandra Mohan / Devyansh / Ishaan',
        pointOfContactPhone: '7849892436',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.OPEN,
        teamSizeMin: 11,
        teamSizeMax: 16,
        maxSubstitutes: 5,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.GENDER_BASED,
        feeMale: 6500.0,
        feeFemale: 3000.0,
        startDate: new Date('2026-09-15T08:00:00Z'),
        venue: 'IIT Patna Football Ground',
        hasAccommodation: true,
        accommodationRate: 490.0, // Rs 490/player/day, per form
        prizePool: 30000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventBasketball,
      data: {
        name: 'Basketball 2K26',
        slug: 'basketball-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Basketball',
        description: '5-a-side basketball tournament. One team roster per gender bracket.',
        pointOfContactName: 'Piyush Kumar / Priyam',
        pointOfContactPhone: '8000101831',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.OPEN,
        teamSizeMin: 5,
        teamSizeMax: 12,
        maxSubstitutes: 7,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.GENDER_BASED,
        feeMale: 4800.0,
        feeFemale: 4200.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Basketball Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 25000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventBadmintonBoys,
      data: {
        name: 'Badminton Boys 2K26',
        slug: 'badminton-boys-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Badminton',
        description: "Men's team badminton tournament.",
        pointOfContactName: 'Vijendra / Parth / Kunal',
        pointOfContactPhone: '8239919115',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.MEN,
        teamSizeMin: 5,
        teamSizeMax: 5,
        maxSubstitutes: 0,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 2500.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Badminton Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 20000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventBadmintonWomen,
      data: {
        name: "Badminton Women's 2K26",
        slug: 'badminton-womens-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Badminton',
        description: "Women's team badminton tournament.",
        pointOfContactName: 'Vijendra / Parth / Kunal',
        pointOfContactPhone: '8239919115',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.WOMEN,
        teamSizeMin: 3,
        teamSizeMax: 3,
        maxSubstitutes: 0,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 1500.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Badminton Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 15000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventLawnTennisBoys,
      data: {
        name: 'Lawn Tennis Boys 2K26',
        slug: 'lawn-tennis-boys-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Lawn Tennis',
        description: "Men's doubles/pair-based lawn tennis tournament.",
        pointOfContactName: 'Himanshu Shekhar C / Raunak',
        pointOfContactPhone: '9108238522',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.MEN,
        teamSizeMin: 2,
        teamSizeMax: 4,
        maxSubstitutes: 2,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 1000.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Lawn Tennis Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 8000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventLawnTennisGirls,
      data: {
        name: 'Lawn Tennis Girls 2K26',
        slug: 'lawn-tennis-girls-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Lawn Tennis',
        description: "Women's doubles/pair-based lawn tennis tournament.",
        pointOfContactName: 'Himanshu Shekhar C / Raunak',
        pointOfContactPhone: '9108238522',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.WOMEN,
        teamSizeMin: 2,
        teamSizeMax: 4,
        maxSubstitutes: 2,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 800.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Lawn Tennis Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 6000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventMrInfinito,
      data: {
        name: 'Mr. Infinito 2K26',
        slug: 'mr-infinito-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Body Show',
        description: 'Individual body show competition.',
        registrationType: EventRegistrationType.INDIVIDUAL,
        genderCategory: GenderCategory.MEN,
        viceCaptainRequired: false,
        coachAllowed: false,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 599.0,
        startDate: new Date('2026-10-05T10:00:00Z'),
        venue: 'IIT Patna Gymkhana',
        hasAccommodation: false,
        isPublished: true,
        registrationOpen: true,
        // Roll No. / College ID have no dedicated Registration columns; College
        // name/address already live on User.college at signup time.
        customFieldsDef: [
          { label: 'Roll No.', inputType: 'TEXT', required: true, scope: 'TEAM' },
          { label: 'College ID', inputType: 'TEXT', required: true, scope: 'TEAM' },
        ],
      },
    },
    {
      id: IDS.eventTableTennisBoys,
      data: {
        name: 'Table Tennis Boys 2K26',
        slug: 'table-tennis-boys-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Table Tennis',
        description: "Men's team table tennis tournament. Bring your own kit.",
        pointOfContactName: 'Akshat Agrawal / Shreya Yadav',
        pointOfContactPhone: '7905554877',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.MEN,
        teamSizeMin: 2,
        teamSizeMax: 4,
        maxSubstitutes: 2,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 1500.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Indoor Sports Complex',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 15000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventTableTennisGirls,
      data: {
        name: 'Table Tennis Girls 2K26',
        slug: 'table-tennis-girls-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Table Tennis',
        description: "Women's team table tennis tournament. Bring your own kit.",
        pointOfContactName: 'Akshat Agrawal / Shreya Yadav',
        pointOfContactPhone: '7905554877',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.WOMEN,
        teamSizeMin: 2,
        teamSizeMax: 3,
        maxSubstitutes: 1,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 1000.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Indoor Sports Complex',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 10000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventSquashBoys,
      data: {
        name: 'Squash Boys 2K26',
        slug: 'squash-boys-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Squash',
        description: "Men's team squash tournament.",
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.MEN,
        teamSizeMin: 3,
        teamSizeMax: 4,
        maxSubstitutes: 1,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 800.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Squash Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 8000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventSquashGirls,
      data: {
        name: 'Squash Girls 2K26',
        slug: 'squash-girls-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Squash',
        description: "Women's team squash tournament.",
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.WOMEN,
        teamSizeMin: 3,
        teamSizeMax: 4,
        maxSubstitutes: 1,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 600.0,
        startDate: new Date('2026-09-16T08:00:00Z'),
        venue: 'IIT Patna Squash Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 5000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventVolleyballMen,
      data: {
        name: 'Volleyball Men 2K26',
        slug: 'volleyball-men-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Volleyball',
        description: "Men's team volleyball tournament.",
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.MEN,
        teamSizeMin: 5,
        teamSizeMax: 11,
        maxSubstitutes: 6,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 4800.0,
        startDate: new Date('2026-09-17T08:00:00Z'),
        venue: 'IIT Patna Volleyball Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 25000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventVolleyballWomen,
      data: {
        name: "Volleyball Women's 2K26",
        slug: 'volleyball-womens-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Volleyball',
        description: "Women's team volleyball tournament.",
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.WOMEN,
        teamSizeMin: 6,
        teamSizeMax: 12,
        maxSubstitutes: 6,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 4500.0,
        startDate: new Date('2026-09-17T08:00:00Z'),
        venue: 'IIT Patna Volleyball Court',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 15000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventChess,
      data: {
        name: 'Chess 2K26',
        slug: 'chess-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Chess',
        description: 'Team chess tournament, per-head registration fee.',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.OPEN,
        teamSizeMin: 4,
        teamSizeMax: 6,
        maxSubstitutes: 0,
        viceCaptainRequired: false,
        coachAllowed: false,
        feeStructure: FeeStructure.PER_HEAD,
        feePerHead: 249.0,
        startDate: new Date('2026-09-15T09:00:00Z'),
        venue: 'IIT Patna Indoor Sports Complex',
        hasAccommodation: false,
        prizePool: 5000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventPowerlifting,
      data: {
        name: 'Powerlifting 2K26',
        slug: 'powerlifting-2k26',
        broadCategory: BroadCategory.INDOOR,
        sportCategory: 'Powerlifting',
        description: 'Small-team powerlifting competition.',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.OPEN,
        teamSizeMin: 1,
        teamSizeMax: 3,
        maxSubstitutes: 0,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 999.0,
        startDate: new Date('2026-09-16T09:00:00Z'),
        venue: 'IIT Patna Gymkhana',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 10000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventAthletics2k26,
      data: {
        name: 'Athletics 2K26 (Track & Field)',
        slug: 'athletics-2k26-track-field',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Athletics',
        description:
          'Individual track and field registration. Select up to 3 individual disciplines ' +
          'and up to 2 relay disciplines; one flat fee covers the full selection.',
        pointOfContactName: 'Prince / Aayush Aryan',
        pointOfContactPhone: '9506122970',
        registrationType: EventRegistrationType.INDIVIDUAL,
        genderCategory: GenderCategory.OPEN,
        viceCaptainRequired: false,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 700.0,
        startDate: new Date('2026-09-16T07:00:00Z'),
        venue: 'IIT Patna Athletic Track',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 50000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventKabaddiBoys,
      data: {
        name: 'Kabaddi Boys 2K26',
        slug: 'kabaddi-boys-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Kabaddi',
        description: "Men's team kabaddi tournament.",
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.MEN,
        teamSizeMin: 7,
        teamSizeMax: 11,
        maxSubstitutes: 4,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 4000.0,
        startDate: new Date('2026-09-17T08:00:00Z'),
        venue: 'IIT Patna Kabaddi Ground',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 25000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
    {
      id: IDS.eventKabaddiGirls,
      data: {
        name: 'Kabaddi Girls 2K26',
        slug: 'kabaddi-girls-2k26',
        broadCategory: BroadCategory.OUTDOOR,
        sportCategory: 'Kabaddi',
        description:
          "Women's team kabaddi tournament. Unlike the men's bracket, one substitute " +
          'is mandatory — reflected here as a higher teamSizeMin rather than a special flag.',
        registrationType: EventRegistrationType.TEAM,
        genderCategory: GenderCategory.WOMEN,
        teamSizeMin: 8,
        teamSizeMax: 12,
        maxSubstitutes: 4,
        viceCaptainRequired: true,
        coachAllowed: true,
        feeStructure: FeeStructure.FLAT,
        feeFlat: 2000.0,
        startDate: new Date('2026-09-17T08:00:00Z'),
        venue: 'IIT Patna Kabaddi Ground',
        hasAccommodation: true,
        accommodationRate: STANDARD_ACCOMMODATION_RATE,
        prizePool: 10000.0,
        isPublished: true,
        registrationOpen: true,
      },
    },
  ];

  for (const { id, data } of infinito2k26Events) {
    await upsertById(prisma.event, id, data);
  }

  console.log(`   ✅  ${infinito2k26Events.length} Infinito 2K26 events created.\n`);

  console.log('🏃  Seeding Athletics 2K26 EventSubOptions...');

  const individualDisciplines: { id: string; name: string }[] = [
    { id: IDS.subOpt100mV2, name: '100m' },
    { id: IDS.subOpt200m, name: '200m' },
    { id: IDS.subOpt400m, name: '400m' },
    { id: IDS.subOpt800m, name: '800m' },
    { id: IDS.subOpt1500m, name: '1500m' },
    { id: IDS.subOpt5000m, name: '5000m' },
    { id: IDS.subOptLongJump, name: 'Long Jump' },
    { id: IDS.subOptDiscusThrow, name: 'Discus Throw' },
    { id: IDS.subOptShotPut, name: 'Shot Put' },
  ];

  for (const discipline of individualDisciplines) {
    await upsertById(prisma.eventSubOption, discipline.id, {
      eventId: IDS.eventAthletics2k26,
      name: discipline.name,
      type: SubOptionType.INDIVIDUAL,
      maxSelectionsPerReg: 3,
      isActive: true,
    });
  }

  const relayDisciplines: { id: string; name: string }[] = [
    { id: IDS.subOpt4x100V2, name: '4×100m Relay' },
    { id: IDS.subOpt4x400V2, name: '4×400m Relay (Boys)' },
    { id: IDS.subOpt4x100Mixed, name: '4×100m Mixed Relay' },
  ];

  for (const relay of relayDisciplines) {
    await upsertById(prisma.eventSubOption, relay.id, {
      eventId: IDS.eventAthletics2k26,
      name: relay.name,
      type: SubOptionType.RELAY,
      maxSelectionsPerReg: 2,
      isActive: true,
    });
  }

  console.log(
    `   ✅  ${individualDisciplines.length} individual + ${relayDisciplines.length} relay Athletics 2K26 sub-options created.\n`,
  );

  // =========================================================================
  // 6. CA PROFILE
  // =========================================================================
  console.log('🎓  Seeding CAProfile...');

  await upsertById(prisma.cAProfile, IDS.caProfile, {
    userId: IDS.userCA,
    refCode: 'CA0001',
    assignedCollegeName: 'Dev College, Mumbai',
    referralCount: 0,
    totalPoints: 0,
    isActive: true,
  });

  console.log('   ✅  CAProfile for CA user created (refCode: CA0001).\n');

  // =========================================================================
  // 7. CA TASK
  // =========================================================================
  console.log('📋  Seeding CaTask...');

  await upsertById(prisma.caTask, IDS.taskReferral, {
    title: 'Get Infinito followers on Instagram',
    description:
      'Share your referral link and get people to follow @InfinitoIITP on Instagram. ' +
      'Each verified follow counts toward your score.',
    category: TaskCategory.REFERRAL,
    source: TaskSource.MODERATOR,
    brandId: null,
    platformId: IDS.platformIG,
    targetMetric: 'followers',
    targetCount: 50,
    targetContentUrl: 'https://instagram.com/infinitiitp',
    points: 10,
    deadline: new Date('2026-08-31T23:59:59Z'),
    proofType: ProofType.SCREENSHOT,
    isActive: true,
    eventId: null,
  });

  console.log('   ✅  1 CaTask (REFERRAL, Instagram) created.\n');

  // =========================================================================
  // 8. TEAMS
  // =========================================================================
  console.log('👥  Seeding Teams...');

  // Football team — external college, captain = userExternal
  await upsertById(prisma.team, IDS.teamFootball, {
    name: 'Seed FC',
    captainId: IDS.userExternal,
    collegeName: 'Dev University',
    collegeAddress: '123 Dev Road, Mumbai',
    isIITP: false,
    viceCaptainName: 'Seed Vice Captain',
    viceCaptainPhone: '+919000000002',
    inviteCode: 'SEEDFC01',
  });

  // BGMI team — IITP, captain = userIITP (triggers ₹0 fee)
  await upsertById(prisma.team, IDS.teamBGMI, {
    name: 'IITP Squad',
    captainId: IDS.userIITP,
    collegeName: 'IIT Patna',
    isIITP: true,
    inviteCode: 'IITPBG01',
  });

  console.log('   ✅  Football team (external) and BGMI team (IITP) created.\n');

  // =========================================================================
  // 9. PARTICIPANTS
  // =========================================================================
  console.log('🙋  Seeding Participants...');

  // Football — 3 participants (Captain + 2 Players)
  await upsertById(prisma.participant, IDS.partFB1, {
    teamId: IDS.teamFootball,
    name: 'FB Captain Dev',
    phone: '+919000000010',
    role: ParticipantRole.CAPTAIN,
    isRequired: true,
    userId: IDS.userExternal, // captain links to User
    photoUrl: 'https://placeholder.infinito2k26.in/seed-photo-fb1.jpg',
    idType: IdentityType.COLLEGE_ID,
    idNumber: 'DEV-2K26-001',
    idFileUrl: 'https://placeholder.infinito2k26.in/seed-id-fb1.pdf',
  });

  await upsertById(prisma.participant, IDS.partFB2, {
    teamId: IDS.teamFootball,
    name: 'FB Player Two',
    phone: '+919000000011',
    role: ParticipantRole.PLAYER,
    isRequired: true,
    photoUrl: 'https://placeholder.infinito2k26.in/seed-photo-fb2.jpg',
    idType: IdentityType.COLLEGE_ID,
    idNumber: 'DEV-2K26-002',
    idFileUrl: 'https://placeholder.infinito2k26.in/seed-id-fb2.pdf',
  });

  await upsertById(prisma.participant, IDS.partFB3, {
    teamId: IDS.teamFootball,
    name: 'FB Player Three',
    phone: '+919000000012',
    role: ParticipantRole.PLAYER,
    isRequired: true,
    photoUrl: 'https://placeholder.infinito2k26.in/seed-photo-fb3.jpg',
    idType: IdentityType.COLLEGE_ID,
    idNumber: 'DEV-2K26-003',
    idFileUrl: 'https://placeholder.infinito2k26.in/seed-id-fb3.pdf',
  });

  // BGMI — 4 participants, each with IGN and BGMI ID in customData
  const bgmiPlayers = [
    {
      id: IDS.partBG1,
      name: 'BGMI Captain Dev',
      role: ParticipantRole.CAPTAIN,
      userId: IDS.userIITP,
      idNumber: 'IITP-2K26-001',
      ign: 'CaptainPro99',
      bgmiId: '512345001',
    },
    {
      id: IDS.partBG2,
      name: 'BGMI Player Two',
      role: ParticipantRole.PLAYER,
      userId: null,
      idNumber: 'IITP-2K26-002',
      ign: 'SnipeKing99',
      bgmiId: '512345002',
    },
    {
      id: IDS.partBG3,
      name: 'BGMI Player Three',
      role: ParticipantRole.PLAYER,
      userId: null,
      idNumber: 'IITP-2K26-003',
      ign: 'RushMaster99',
      bgmiId: '512345003',
    },
    {
      id: IDS.partBG4,
      name: 'BGMI Substitute',
      role: ParticipantRole.SUBSTITUTE,
      userId: null,
      idNumber: 'IITP-2K26-004',
      ign: 'SubGod99',
      bgmiId: '512345004',
    },
  ];

  for (const p of bgmiPlayers) {
    await upsertById(prisma.participant, p.id, {
      teamId: IDS.teamBGMI,
      name: p.name,
      role: p.role,
      isRequired: p.role !== ParticipantRole.SUBSTITUTE,
      userId: p.userId,
      photoUrl: `https://placeholder.infinito2k26.in/seed-photo-bg-${p.bgmiId}.jpg`,
      idType: IdentityType.COLLEGE_ID,
      idNumber: p.idNumber,
      idFileUrl: `https://placeholder.infinito2k26.in/seed-id-bg-${p.bgmiId}.pdf`,
      customData: {
        'In-Game Name': p.ign,
        'BGMI ID': p.bgmiId,
      },
    });
  }

  console.log('   ✅  3 Football participants, 4 BGMI participants created.\n');

  // =========================================================================
  // 10. REGISTRATIONS
  // =========================================================================
  console.log('📝  Seeding Registrations...');

  // Football team registration — CONFIRMED, referred by CA
  await upsertById(prisma.registration, IDS.regFootball, {
    eventId: IDS.eventFootball,
    teamId: IDS.teamFootball,
    userId: null,
    status: RegistrationStatus.CONFIRMED,
    isIITP: false,
    genderDeclared: GenderCategory.MEN,
    accommodationOpted: true,
    accommodationDays: 3,
    accommodationHeadcount: 3,
    referredById: IDS.caProfile,
    customData: { 'Any special requirements?': 'None' },
  });

  // BGMI team registration — CONFIRMED, IITP (₹0 fee)
  await upsertById(prisma.registration, IDS.regBGMI, {
    eventId: IDS.eventBGMI,
    teamId: IDS.teamBGMI,
    userId: null,
    status: RegistrationStatus.CONFIRMED,
    isIITP: true,
    accommodationOpted: false,
  });

  // Athletics individual registration — CONFIRMED
  await upsertById(prisma.registration, IDS.regAthletics, {
    eventId: IDS.eventAthletics,
    teamId: null,
    userId: IDS.userExternal,
    status: RegistrationStatus.CONFIRMED,
    isIITP: false,
    genderDeclared: GenderCategory.OPEN,
    accommodationOpted: false,
  });

  console.log('   ✅  Football (CONFIRMED), BGMI (CONFIRMED, IITP ₹0), Athletics (CONFIRMED, individual) created.\n');

  // =========================================================================
  // 11. REGISTRATION SUB OPTIONS (Athletics — 100m + 4×100m Relay)
  // =========================================================================
  console.log('🏅  Seeding RegistrationSubOptions...');

  await upsertById(prisma.registrationSubOption, IDS.regSubOpt1, {
    registrationId: IDS.regAthletics,
    subOptionId: IDS.subOption100m,
    relayMembers: null,
  });

  await upsertById(prisma.registrationSubOption, IDS.regSubOpt2, {
    registrationId: IDS.regAthletics,
    subOptionId: IDS.subOption4x100,
    // Relay member names — actual Participant rows not required for this seed
    relayMembers: ['Relay Runner One', 'Relay Runner Two', 'Relay Runner Three'],
  });

  console.log('   ✅  100m + 4×100m Relay sub-options registered.\n');

  // =========================================================================
  // 12. REFERRAL CONVERSION (Football registration attributed to CA)
  // =========================================================================
  console.log('🔗  Seeding ReferralConversion...');

  await upsertById(prisma.referralConversion, IDS.referralConv, {
    caId: IDS.caProfile,
    registrationId: IDS.regFootball,
  });

  console.log('   ✅  ReferralConversion created for Football registration.\n');

  // =========================================================================
  // 13. PAYMENT (Football — MANUAL_SCREENSHOT, SUCCESS)
  // =========================================================================
  console.log('💳  Seeding Payment...');

  await upsertById(prisma.payment, IDS.paymentFootball, {
    registrationId: IDS.regFootball,
    amount: 500.00,
    mode: PaymentMode.MANUAL_SCREENSHOT,
    status: PaymentStatus.SUCCESS,
    gatewayOrderId: null,
    gatewayPaymentId: null,
    screenshotUrl: 'https://placeholder.infinito2k26.in/seed-payment-screenshot.jpg',
    transactionId: 'SEED-TXN-20260901-001',
    webhookVerified: false,
    idempotencyKey: 'seed-payment-football-001',
  });

  console.log('   ✅  1 manual screenshot payment (SUCCESS) created.\n');

  // =========================================================================
  // 14. CREDENTIALS
  // =========================================================================
  console.log('🎫  Seeding Credentials...');

  // Football — one credential per participant (3)
  const fbCredentials = [
    { id: IDS.credFB1, participantId: IDS.partFB1, token: 'seed-token-fb1-sha256hash-0000001' },
    { id: IDS.credFB2, participantId: IDS.partFB2, token: 'seed-token-fb2-sha256hash-0000002' },
    { id: IDS.credFB3, participantId: IDS.partFB3, token: 'seed-token-fb3-sha256hash-0000003' },
  ];

  for (const cred of fbCredentials) {
    await upsertById(prisma.credential, cred.id, {
      registrationId: IDS.regFootball,
      participantId: cred.participantId,
      userId: null,
      tokenHash: cred.token,
      qrImageUrl: `https://placeholder.infinito2k26.in/seed-qr-${cred.token}.png`,
      scanCount: 0,
    });
  }

  // Athletics — one credential for the individual user
  await upsertById(prisma.credential, IDS.credIndividual, {
    registrationId: IDS.regAthletics,
    participantId: null,
    userId: IDS.userExternal,
    tokenHash: 'seed-token-individual-sha256hash-0000004',
    qrImageUrl: 'https://placeholder.infinito2k26.in/seed-qr-individual.png',
    scanCount: 0,
  });

  console.log('   ✅  3 participant credentials (Football) + 1 individual credential (Athletics) created.\n');

  // =========================================================================
  // 15. CA TASK ASSIGNMENT
  // =========================================================================
  console.log('✅  Seeding CATaskAssignment...');

  await upsertById(prisma.cATaskAssignment, IDS.taskAssignment, {
    caId: IDS.caProfile,
    taskId: IDS.taskReferral,
    status: TaskStatus.PENDING,
    proofUrl: null,
    proofNote: null,
    pointsAwarded: null,
  });

  console.log('   ✅  CA assigned to referral task.\n');

  // =========================================================================
  // 16. SOCIAL REFERRAL (BEHAVIORAL — Instagram)
  // =========================================================================
  console.log('📲  Seeding SocialReferral...');

  // Check existence manually since @@unique is on [platformId, verifiedUserId]
  const existingReferral = await prisma.socialReferral.findUnique({
    where: {
      platformId_verifiedUserId: {
        platformId: IDS.platformIG,
        verifiedUserId: 'seed-ig-user-id-external-001',
      },
    },
  });

  if (!existingReferral) {
    await prisma.socialReferral.create({
      data: {
        id: IDS.socialReferral,
        caId: IDS.caProfile,
        platformId: IDS.platformIG,
        taskId: IDS.taskReferral,
        verifiedUserId: 'seed-ig-user-id-external-001', // Instagram OAuth-returned user ID
        verifiedHandle: '@seed_follower_2026',
        sessionToken: null, // session already consumed; set null after verification
        verificationLevel: VerificationLevel.BEHAVIORAL,
        attributes: { handle: '@seed_follower_2026', profileUrl: 'https://instagram.com/seed_follower_2026' },
        metrics: { followers: 820 },
      },
    });
    console.log('   ✅  SocialReferral (BEHAVIORAL, Instagram) created.\n');
  } else {
    console.log('   ℹ️   SocialReferral already exists — skipped.\n');
  }

  // =========================================================================
  // 17. SCAN LOG (Gate 1 ENTRY scan on Football captain's credential)
  // =========================================================================
  console.log('🔍  Seeding ScanLog...');

  // ScanLog is immutable — check for seed ID to stay idempotent
  const existingScan = await prisma.scanLog.findUnique({
    where: { id: IDS.scanLog },
  });

  if (!existingScan) {
    await prisma.scanLog.create({
      data: {
        id: IDS.scanLog,
        credentialId: IDS.credFB1,
        scannedById: IDS.userVolunteer,
        gate: 'Gate 1',
        direction: ScanDirection.ENTRY,
        result: ScanResult.VALID,
        metadata: { device: 'seed-scanner-device', note: 'Seed scan for dev verification.' },
      },
    });
    // Update scanCount on the credential
    await prisma.credential.update({
      where: { id: IDS.credFB1 },
      data: { scanCount: 1, lastScannedAt: new Date() },
    });
    console.log('   ✅  ScanLog (Gate 1 ENTRY, VALID) created.\n');
  } else {
    console.log('   ℹ️   ScanLog already exists — skipped.\n');
  }

  // =========================================================================
  // SUMMARY
  // =========================================================================
  console.log('═'.repeat(60));
  console.log('✅  Seed complete!\n');
  console.log('📊  Entity summary:');
  console.log('   User                 : 6  (admin, moderator, volunteer, CA, IITP, external)');
  console.log('   SocialPlatformConfig : 4  (Instagram, YouTube, Twitter, LinkedIn)');
  console.log('   Brand                : 1');
  console.log('   Event                : 3 dev fixtures (Football, BGMI, Athletics) + 19 Infinito 2K26 catalog events');
  console.log('   EventSubOption       : 2 dev fixtures (100m, 4×100m Relay) + 12 Athletics 2K26 (9 individual + 3 relay)');
  console.log('   CAProfile            : 1');
  console.log('   CaTask               : 1  (REFERRAL, Instagram)');
  console.log('   Team                 : 2  (Football external, BGMI IITP)');
  console.log('   Participant          : 7  (3 Football + 4 BGMI)');
  console.log('   Registration         : 3  (Football, BGMI, Athletics individual)');
  console.log('   RegistrationSubOption: 2  (100m, 4×100m Relay)');
  console.log('   ReferralConversion   : 1');
  console.log('   Payment              : 1  (Football, MANUAL_SCREENSHOT, SUCCESS)');
  console.log('   Credential           : 4  (3 Football participants + 1 individual)');
  console.log('   CATaskAssignment     : 1');
  console.log('   SocialReferral       : 1  (BEHAVIORAL, Instagram)');
  console.log('   ScanLog              : 1  (Gate 1 ENTRY, VALID)\n');
  console.log('🔑  All seed users share password: Infinito@dev123  (FAKE — dev only)');
  console.log('   admin@infinito2k26.in');
  console.log('   moderator@infinito2k26.in');
  console.log('   volunteer@infinito2k26.in');
  console.log('   ca@infinito2k26.in');
  console.log('   iitp.participant@infinito2k26.in');
  console.log('   participant@infinito2k26.in');
  console.log('═'.repeat(60));
}

main()
  .catch((e) => {
    console.error('\n❌  Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
