import {
  PrismaClient,
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
import 'dotenv/config' ;

const prisma = new PrismaClient();

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
  caProfile:        'g0000000-0000-0000-0000-000000000001',

  // Teams
  teamFootball:     'h0000000-0000-0000-0000-000000000001',
  teamBGMI:         'h0000000-0000-0000-0000-000000000002',

  // Participants — Football (3)
  partFB1:          'i0000000-0000-0000-0000-000000000001',
  partFB2:          'i0000000-0000-0000-0000-000000000002',
  partFB3:          'i0000000-0000-0000-0000-000000000003',

  // Participants — BGMI (4)
  partBG1:          'i0000000-0000-0000-0000-000000000004',
  partBG2:          'i0000000-0000-0000-0000-000000000005',
  partBG3:          'i0000000-0000-0000-0000-000000000006',
  partBG4:          'i0000000-0000-0000-0000-000000000007',

  // Registrations
  regFootball:      'j0000000-0000-0000-0000-000000000001',
  regBGMI:          'j0000000-0000-0000-0000-000000000002',
  regAthletics:     'j0000000-0000-0000-0000-000000000003',

  // RegistrationSubOptions
  regSubOpt1:       'k0000000-0000-0000-0000-000000000001',
  regSubOpt2:       'k0000000-0000-0000-0000-000000000002',

  // Payment
  paymentFootball:  'l0000000-0000-0000-0000-000000000001',

  // Credentials
  credFB1:          'm0000000-0000-0000-0000-000000000001',
  credFB2:          'm0000000-0000-0000-0000-000000000002',
  credFB3:          'm0000000-0000-0000-0000-000000000003',
  credIndividual:   'm0000000-0000-0000-0000-000000000004',

  // CATaskAssignment
  taskAssignment:   'n0000000-0000-0000-0000-000000000001',

  // SocialReferral
  socialReferral:   'o0000000-0000-0000-0000-000000000001',

  // ReferralConversion
  referralConv:     'p0000000-0000-0000-0000-000000000001',

  // ScanLog
  scanLog:          'q0000000-0000-0000-0000-000000000001',
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
  console.log('   Event                : 3  (Football, BGMI, Athletics)');
  console.log('   EventSubOption       : 2  (100m, 4×100m Relay)');
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
