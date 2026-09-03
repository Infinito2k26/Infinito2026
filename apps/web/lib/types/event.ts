// Matches the backend's real Event/EventSubOption enums and fields
// (apps/api/prisma/schema.prisma).

export type BroadCategory = "OUTDOOR" | "INDOOR" | "ESPORTS" | "CULTURAL" | "TECHNICAL";
export type EventRegistrationType = "INDIVIDUAL" | "TEAM";
export type GenderCategory = "OPEN" | "MEN" | "WOMEN";
export type FeeStructure = "FLAT" | "PER_HEAD" | "GENDER_BASED";
export type CustomFieldType = "TEXT" | "NUMBER" | "SELECT" | "FILE";
export type CustomFieldScope = "TEAM" | "PARTICIPANT";
export type SubOptionType = "INDIVIDUAL" | "RELAY";

export interface CustomFieldDef {
    label: string;
    inputType: CustomFieldType;
    required: boolean;
    scope: CustomFieldScope;
    options?: string[];
}

export interface EventSubOption {
    id: string;
    eventId: string;
    name: string;
    type: SubOptionType;
    maxSelectionsPerReg: number;
    isActive: boolean;
}

export interface EventSummary {
    id: string;
    name: string;
    slug: string;
    broadCategory: BroadCategory;
    sportCategory: string;
    registrationType: EventRegistrationType;
    feeStructure: FeeStructure;
    feeFlat: string | number | null;
    feePerHead: string | number | null;
    feeMale: string | number | null;
    feeFemale: string | number | null;
    startDate: string;
    venue: string | null;
    registrationOpen: boolean;
}

export interface EventDetail extends EventSummary {
    description: string | null;
    pointOfContactName: string | null;
    pointOfContactPhone: string | null;
    genderCategory: GenderCategory;
    teamSizeMin: number | null;
    teamSizeMax: number | null;
    viceCaptainRequired: boolean;
    coachAllowed: boolean;
    endDate: string | null;
    hasAccommodation: boolean;
    accommodationRate: string | number | null;
    messOnlyRate: string | number | null;
    prizePool: string | number | null;
    capacity: number | null;
    isPublished: boolean;
    customFieldsDef: CustomFieldDef[] | null;
    subOptions: EventSubOption[];
    pointOfContactName: string | null;
    pointOfContactPhone: string | null;
}
