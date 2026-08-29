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
}
