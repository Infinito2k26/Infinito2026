import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsInt,
  IsBoolean,
  IsNumber,
  IsDateString,
  IsArray,
  Min,
} from 'class-validator';
import {
  BroadCategory,
  EventRegistrationType,
  GenderCategory,
  FeeStructure,
} from '@prisma/client';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  slug!: string;

  @IsEnum(BroadCategory)
  broadCategory!: BroadCategory;

  @IsString()
  @IsNotEmpty()
  sportCategory!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pointOfContactName?: string;

  @IsString()
  @IsOptional()
  pointOfContactPhone?: string;

  @IsEnum(EventRegistrationType)
  registrationType!: EventRegistrationType;

  @IsEnum(GenderCategory)
  genderCategory!: GenderCategory;

  @IsInt()
  @IsOptional()
  teamSizeMin?: number;

  @IsInt()
  @IsOptional()
  teamSizeMax?: number;

  @IsInt()
  @IsOptional()
  maxSubstitutes?: number;

  @IsBoolean()
  @IsOptional()
  viceCaptainRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  coachAllowed?: boolean;

  @IsEnum(FeeStructure)
  feeStructure!: FeeStructure;

  @IsNumber()
  @IsOptional()
  feeFlat?: number;

  @IsNumber()
  @IsOptional()
  feePerHead?: number;

  @IsNumber()
  @IsOptional()
  feeMale?: number;

  @IsNumber()
  @IsOptional()
  feeFemale?: number;

  @IsDateString()
  startDate!: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsBoolean()
  @IsOptional()
  hasAccommodation?: boolean;

  @IsNumber()
  @IsOptional()
  accommodationRate?: number;

  @IsNumber()
  @IsOptional()
  prizePool?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @IsArray()
  @IsOptional()
  customFieldsDef?: Record<string, unknown>[];
}

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  slug?: string;

  @IsEnum(BroadCategory)
  @IsOptional()
  broadCategory?: BroadCategory;

  @IsString()
  @IsOptional()
  sportCategory?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  pointOfContactName?: string;

  @IsString()
  @IsOptional()
  pointOfContactPhone?: string;

  @IsEnum(EventRegistrationType)
  @IsOptional()
  registrationType?: EventRegistrationType;

  @IsEnum(GenderCategory)
  @IsOptional()
  genderCategory?: GenderCategory;

  @IsInt()
  @IsOptional()
  teamSizeMin?: number;

  @IsInt()
  @IsOptional()
  teamSizeMax?: number;

  @IsInt()
  @IsOptional()
  maxSubstitutes?: number;

  @IsBoolean()
  @IsOptional()
  viceCaptainRequired?: boolean;

  @IsBoolean()
  @IsOptional()
  coachAllowed?: boolean;

  @IsEnum(FeeStructure)
  @IsOptional()
  feeStructure?: FeeStructure;

  @IsNumber()
  @IsOptional()
  feeFlat?: number;

  @IsNumber()
  @IsOptional()
  feePerHead?: number;

  @IsNumber()
  @IsOptional()
  feeMale?: number;

  @IsNumber()
  @IsOptional()
  feeFemale?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;

  @IsDateString()
  @IsOptional()
  endDate?: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsBoolean()
  @IsOptional()
  hasAccommodation?: boolean;

  @IsNumber()
  @IsOptional()
  accommodationRate?: number;

  @IsNumber()
  @IsOptional()
  prizePool?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  capacity?: number;

  @IsArray()
  @IsOptional()
  customFieldsDef?: Record<string, unknown>[];

  @IsBoolean()
  @IsOptional()
  registrationOpen?: boolean;
}

export class PublishEventDto {
  @IsBoolean()
  isPublished!: boolean;
}
