import { Transform, Type } from 'class-transformer';
import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
  IsIn,
  IsObject,
  IsArray,
  IsString,
  IsNotEmpty,
  ValidateNested,
  Equals,
} from 'class-validator';
import { GenderCategory, IdentityType } from '@prisma/client';

// Individual registrations submit multipart/form-data (to carry the photo
// and ID document files alongside the rest of the fields — see
// registrations.controller.ts), where every field arrives as a string.
// Team registrations still submit plain JSON. These two transforms make the
// same DTO accept either shape correctly.
const toBoolean = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value === 'true' : value;

const parseIfString = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? (JSON.parse(value) as unknown) : value;

// Mirrors teams/dto/teams.dto.ts: the second document must be a distinct
// type from the College ID slot, which is always COLLEGE_ID.
export const SECONDARY_IDENTITY_TYPES = Object.values(IdentityType).filter(
  (type) => type !== IdentityType.COLLEGE_ID,
);

export class SubOptionSelectionDto {
  @IsUUID()
  subOptionId!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  relayMembers?: string[];
}

export class CreateRegistrationDto {
  @IsUUID()
  eventId!: string;

  // Required for TEAM events, forbidden for INDIVIDUAL events.
  @IsOptional()
  @IsUUID()
  teamId?: string;

  // Two independent, stackable add-ons (accommodation = lodging + mess;
  // messOnly = mess only). Both share accommodationDays as the length of
  // stay. See RegistrationsService.validateAccommodation for the gating
  // rules (requires Event.hasAccommodation, headcounts capped by team size).
  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  accommodationOpted?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  accommodationDays?: number;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  accommodationHeadcount?: number;

  @Transform(toBoolean)
  @IsOptional()
  @IsBoolean()
  messOnlyOpted?: boolean;

  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  messOnlyHeadcount?: number;

  // Required when the event's feeStructure is GENDER_BASED.
  @IsOptional()
  @IsEnum(GenderCategory)
  genderDeclared?: GenderCategory;

  // Responses to Event.customFieldsDef entries scoped TEAM, keyed by label.
  @Transform(parseIfString)
  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;

  // Athletics-shaped events only: picks from Event.subOptions.
  @Transform(parseIfString)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SubOptionSelectionDto)
  subOptionSelections?: SubOptionSelectionDto[];

  // Not persisted — just gates registration on having agreed to
  // /registration-guidelines, mirroring the checkbox on the register page.
  // TS-optional so RegistrationsService callers/tests that build this DTO
  // directly (bypassing the ValidationPipe) don't need to set it; the real
  // HTTP path still rejects a missing/false value via @Equals(true).
  @Equals(true, { message: 'You must agree to the Registration Guidelines' })
  agreedToGuidelines?: boolean;

  // Individual-event identity, mirroring teams/dto/teams.dto.ts's
  // College-ID-plus-one-other-document requirement — required for
  // INDIVIDUAL registrations, forbidden for TEAM ones (the captain's
  // identity lives on their Participant row instead). Enforced in
  // RegistrationsService, not here, since "required" depends on the event.
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  idNumber?: string;

  @IsOptional()
  @IsIn(SECONDARY_IDENTITY_TYPES)
  secondaryIdType?: IdentityType;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  secondaryIdNumber?: string;
}
