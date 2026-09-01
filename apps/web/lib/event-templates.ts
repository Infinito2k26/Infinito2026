// Presets for the admin "create from template" dropdown. Values mirror the
// Infinito 2K26 event catalog in apps/api/prisma/seed.ts (itself sourced
// from docs/event-registration-schema.md) — the real per-sport fees, team
// sizes, and venues already collected for this fest. Admin picks one, the
// create form autofills, they review dates/venue and publish.
export interface EventTemplate {
    label: string;
    name: string;
    slug: string;
    broadCategory: "OUTDOOR" | "INDOOR" | "ESPORTS" | "CULTURAL" | "TECHNICAL";
    sportCategory: string;
    description?: string;
    pointOfContactName?: string;
    pointOfContactPhone?: string;
    registrationType: "INDIVIDUAL" | "TEAM";
    genderCategory: "OPEN" | "MEN" | "WOMEN";
    teamSizeMin?: number;
    teamSizeMax?: number;
    maxSubstitutes?: number;
    viceCaptainRequired?: boolean;
    coachAllowed?: boolean;
    feeStructure: "FLAT" | "PER_HEAD" | "GENDER_BASED";
    feeFlat?: number;
    feePerHead?: number;
    feeMale?: number;
    feeFemale?: number;
    startDate: string;
    venue?: string;
    hasAccommodation?: boolean;
    accommodationRate?: number;
    prizePool?: number;
}

const STANDARD_ACCOMMODATION_RATE = 490.0;

export const EVENT_TEMPLATES: EventTemplate[] = [
    {
        label: "Cricket", name: "Cricket 2K26", slug: "cricket-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Cricket",
        description: "11-a-side cricket tournament, open registration.",
        pointOfContactName: "Ankit Singh / K Ayush / Akshay Kumar", pointOfContactPhone: "9508830291",
        registrationType: "TEAM", genderCategory: "OPEN",
        teamSizeMin: 11, teamSizeMax: 16, maxSubstitutes: 5, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 6500.0,
        startDate: "2026-09-15T08:00", venue: "IIT Patna Cricket Ground",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 50000.0,
    },
    {
        label: "Football", name: "Football 2K26", slug: "football-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Football",
        description: "11-a-side football tournament. One team roster per gender bracket.",
        pointOfContactName: "Chandra Mohan / Devyansh / Ishaan", pointOfContactPhone: "7849892436",
        registrationType: "TEAM", genderCategory: "OPEN",
        teamSizeMin: 11, teamSizeMax: 16, maxSubstitutes: 5, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "GENDER_BASED", feeMale: 6500.0, feeFemale: 3000.0,
        startDate: "2026-09-15T08:00", venue: "IIT Patna Football Ground",
        hasAccommodation: true, accommodationRate: 490.0, prizePool: 30000.0,
    },
    {
        label: "Basketball", name: "Basketball 2K26", slug: "basketball-2k26",
        broadCategory: "INDOOR", sportCategory: "Basketball",
        description: "5-a-side basketball tournament. One team roster per gender bracket.",
        pointOfContactName: "Piyush Kumar / Priyam", pointOfContactPhone: "8000101831",
        registrationType: "TEAM", genderCategory: "OPEN",
        teamSizeMin: 5, teamSizeMax: 12, maxSubstitutes: 7, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "GENDER_BASED", feeMale: 4800.0, feeFemale: 4200.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Basketball Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 25000.0,
    },
    {
        label: "Badminton (Boys)", name: "Badminton Boys 2K26", slug: "badminton-boys-2k26",
        broadCategory: "INDOOR", sportCategory: "Badminton",
        description: "Men's team badminton tournament.",
        pointOfContactName: "Vijendra / Parth / Kunal", pointOfContactPhone: "8239919115",
        registrationType: "TEAM", genderCategory: "MEN",
        teamSizeMin: 5, teamSizeMax: 5, maxSubstitutes: 0, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 2500.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Badminton Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 20000.0,
    },
    {
        label: "Badminton (Women's)", name: "Badminton Women's 2K26", slug: "badminton-womens-2k26",
        broadCategory: "INDOOR", sportCategory: "Badminton",
        description: "Women's team badminton tournament.",
        pointOfContactName: "Vijendra / Parth / Kunal", pointOfContactPhone: "8239919115",
        registrationType: "TEAM", genderCategory: "WOMEN",
        teamSizeMin: 3, teamSizeMax: 3, maxSubstitutes: 0, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 1500.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Badminton Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 15000.0,
    },
    {
        label: "Lawn Tennis (Boys)", name: "Lawn Tennis Boys 2K26", slug: "lawn-tennis-boys-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Lawn Tennis",
        description: "Men's doubles/pair-based lawn tennis tournament.",
        pointOfContactName: "Himanshu Shekhar C / Raunak", pointOfContactPhone: "9108238522",
        registrationType: "TEAM", genderCategory: "MEN",
        teamSizeMin: 2, teamSizeMax: 4, maxSubstitutes: 2, viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 1000.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Lawn Tennis Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 8000.0,
    },
    {
        label: "Lawn Tennis (Girls)", name: "Lawn Tennis Girls 2K26", slug: "lawn-tennis-girls-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Lawn Tennis",
        description: "Women's doubles/pair-based lawn tennis tournament.",
        pointOfContactName: "Himanshu Shekhar C / Raunak", pointOfContactPhone: "9108238522",
        registrationType: "TEAM", genderCategory: "WOMEN",
        teamSizeMin: 2, teamSizeMax: 4, maxSubstitutes: 2, viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 800.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Lawn Tennis Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 6000.0,
    },
    {
        label: "Mr. Infinito", name: "Mr. Infinito 2K26", slug: "mr-infinito-2k26",
        broadCategory: "INDOOR", sportCategory: "Body Show",
        description: "Individual body show competition.",
        registrationType: "INDIVIDUAL", genderCategory: "MEN",
        viceCaptainRequired: false, coachAllowed: false,
        feeStructure: "FLAT", feeFlat: 599.0,
        startDate: "2026-10-05T10:00", venue: "IIT Patna Gymkhana",
        hasAccommodation: false,
    },
    {
        label: "Table Tennis (Boys)", name: "Table Tennis Boys 2K26", slug: "table-tennis-boys-2k26",
        broadCategory: "INDOOR", sportCategory: "Table Tennis",
        description: "Men's team table tennis tournament. Bring your own kit.",
        pointOfContactName: "Akshat Agrawal / Shreya Yadav", pointOfContactPhone: "7905554877",
        registrationType: "TEAM", genderCategory: "MEN",
        teamSizeMin: 2, teamSizeMax: 4, maxSubstitutes: 2, viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 1500.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Indoor Sports Complex",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 15000.0,
    },
    {
        label: "Table Tennis (Girls)", name: "Table Tennis Girls 2K26", slug: "table-tennis-girls-2k26",
        broadCategory: "INDOOR", sportCategory: "Table Tennis",
        description: "Women's team table tennis tournament. Bring your own kit.",
        pointOfContactName: "Akshat Agrawal / Shreya Yadav", pointOfContactPhone: "7905554877",
        registrationType: "TEAM", genderCategory: "WOMEN",
        teamSizeMin: 2, teamSizeMax: 3, maxSubstitutes: 1, viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 1000.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Indoor Sports Complex",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 10000.0,
    },
    {
        label: "Squash (Boys)", name: "Squash Boys 2K26", slug: "squash-boys-2k26",
        broadCategory: "INDOOR", sportCategory: "Squash",
        description: "Men's team squash tournament.",
        registrationType: "TEAM", genderCategory: "MEN",
        teamSizeMin: 3, teamSizeMax: 4, maxSubstitutes: 1, viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 800.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Squash Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 8000.0,
    },
    {
        label: "Squash (Girls)", name: "Squash Girls 2K26", slug: "squash-girls-2k26",
        broadCategory: "INDOOR", sportCategory: "Squash",
        description: "Women's team squash tournament.",
        registrationType: "TEAM", genderCategory: "WOMEN",
        teamSizeMin: 3, teamSizeMax: 4, maxSubstitutes: 1, viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 600.0,
        startDate: "2026-09-16T08:00", venue: "IIT Patna Squash Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 5000.0,
    },
    {
        label: "Volleyball (Men)", name: "Volleyball Men 2K26", slug: "volleyball-men-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Volleyball",
        description: "Men's team volleyball tournament.",
        registrationType: "TEAM", genderCategory: "MEN",
        teamSizeMin: 5, teamSizeMax: 11, maxSubstitutes: 6, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 4800.0,
        startDate: "2026-09-17T08:00", venue: "IIT Patna Volleyball Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 25000.0,
    },
    {
        label: "Volleyball (Women's)", name: "Volleyball Women's 2K26", slug: "volleyball-womens-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Volleyball",
        description: "Women's team volleyball tournament.",
        registrationType: "TEAM", genderCategory: "WOMEN",
        teamSizeMin: 6, teamSizeMax: 12, maxSubstitutes: 6, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 4500.0,
        startDate: "2026-09-17T08:00", venue: "IIT Patna Volleyball Court",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 15000.0,
    },
    {
        label: "Chess", name: "Chess 2K26", slug: "chess-2k26",
        broadCategory: "INDOOR", sportCategory: "Chess",
        description: "Team chess tournament, per-head registration fee.",
        registrationType: "TEAM", genderCategory: "OPEN",
        teamSizeMin: 4, teamSizeMax: 6, maxSubstitutes: 0, viceCaptainRequired: false, coachAllowed: false,
        feeStructure: "PER_HEAD", feePerHead: 249.0,
        startDate: "2026-09-15T09:00", venue: "IIT Patna Indoor Sports Complex",
        hasAccommodation: false, prizePool: 5000.0,
    },
    {
        label: "Powerlifting", name: "Powerlifting 2K26", slug: "powerlifting-2k26",
        broadCategory: "INDOOR", sportCategory: "Powerlifting",
        description: "Small-team powerlifting competition.",
        registrationType: "TEAM", genderCategory: "OPEN",
        teamSizeMin: 1, teamSizeMax: 3, maxSubstitutes: 0, viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 999.0,
        startDate: "2026-09-16T09:00", venue: "IIT Patna Gymkhana",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 10000.0,
    },
    {
        label: "Athletics (Track & Field)", name: "Athletics 2K26 (Track & Field)", slug: "athletics-2k26-track-field",
        broadCategory: "OUTDOOR", sportCategory: "Athletics",
        description: "Individual track and field registration. Select up to 3 individual disciplines and up to 2 relay disciplines; one flat fee covers the full selection.",
        pointOfContactName: "Prince / Aayush Aryan", pointOfContactPhone: "9506122970",
        registrationType: "INDIVIDUAL", genderCategory: "OPEN",
        viceCaptainRequired: false, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 700.0,
        startDate: "2026-09-16T07:00", venue: "IIT Patna Athletic Track",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 50000.0,
    },
    {
        label: "Kabaddi (Boys)", name: "Kabaddi Boys 2K26", slug: "kabaddi-boys-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Kabaddi",
        description: "Men's team kabaddi tournament.",
        registrationType: "TEAM", genderCategory: "MEN",
        teamSizeMin: 7, teamSizeMax: 11, maxSubstitutes: 4, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 4000.0,
        startDate: "2026-09-17T08:00", venue: "IIT Patna Kabaddi Ground",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 25000.0,
    },
    {
        label: "Kabaddi (Girls)", name: "Kabaddi Girls 2K26", slug: "kabaddi-girls-2k26",
        broadCategory: "OUTDOOR", sportCategory: "Kabaddi",
        description: "Women's team kabaddi tournament. One substitute is mandatory — reflected as a higher teamSizeMin.",
        registrationType: "TEAM", genderCategory: "WOMEN",
        teamSizeMin: 8, teamSizeMax: 12, maxSubstitutes: 4, viceCaptainRequired: true, coachAllowed: true,
        feeStructure: "FLAT", feeFlat: 2000.0,
        startDate: "2026-09-17T08:00", venue: "IIT Patna Kabaddi Ground",
        hasAccommodation: true, accommodationRate: STANDARD_ACCOMMODATION_RATE, prizePool: 10000.0,
    },
];
