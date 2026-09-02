// Mirrors apps/api/src/registrations/dto/create-registration.dto.ts

export interface SubOptionSelection {
    subOptionId: string;
    relayMembers?: string[];
}

export interface CreateRegistrationPayload {
    eventId: string;
    teamId?: string;
    genderDeclared?: "MEN" | "WOMEN" | "OPEN";
    customData?: Record<string, unknown>;
    subOptionSelections?: SubOptionSelection[];
    accommodationOpted?: boolean;
    accommodationDays?: number;
    accommodationHeadcount?: number;
    messOnlyOpted?: boolean;
    messOnlyHeadcount?: number;
    agreedToGuidelines: boolean;
}

export interface RegistrationResult {
    id: string;
    eventId: string;
    status: string;
    payment: {
        id: string;
        amount: string | number;
        mode: string;
        status: string;
    };
}
