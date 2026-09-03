import { Type } from 'class-transformer';
import {
  IsUUID,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
  IsObject,
  IsArray,
  IsString,
  ValidateNested,
  Equals,
} from 'class-validator';
import { GenderCategory } from '@prisma/client';

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
  @IsOptional()
  @IsBoolean()
  accommodationOpted?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  accommodationDays?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  accommodationHeadcount?: number;

  @IsOptional()
  @IsBoolean()
  messOnlyOpted?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  messOnlyHeadcount?: number;

  // Required when the event's feeStructure is GENDER_BASED.
  @IsOptional()
  @IsEnum(GenderCategory)
  genderDeclared?: GenderCategory;

  // Responses to Event.customFieldsDef entries scoped TEAM, keyed by label.
  @IsOptional()
  @IsObject()
  customData?: Record<string, unknown>;

  // Athletics-shaped events only: picks from Event.subOptions.
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
}
