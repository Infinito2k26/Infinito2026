import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsIn,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IdentityType } from '@prisma/client';

// The second document must be a distinct type from the College ID slot, which is always COLLEGE_ID.
export const SECONDARY_IDENTITY_TYPES = Object.values(IdentityType).filter(
  (type) => type !== IdentityType.COLLEGE_ID,
);

export class CreateTeamDto {
  @IsUUID()
  eventId!: string;

  // Roster size the captain commits to now; teammates join later via invite
  // code. Checked against Event.teamSizeMin/Max at creation time.
  @Type(() => Number)
  @IsInt()
  @Min(1)
  declaredSize!: number;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  collegeName!: string;

  @IsString()
  @IsOptional()
  collegeAddress?: string;

  @IsString()
  @IsOptional()
  viceCaptainName?: string;

  @IsString()
  @IsOptional()
  viceCaptainPhone?: string;

  @IsString()
  @IsOptional()
  coachName?: string;

  @IsString()
  @IsOptional()
  coachPhone?: string;

  // Captain's own roster entry — name/phone come from their User record.
  // College ID is always required and always this type; no client choice.
  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @IsIn(SECONDARY_IDENTITY_TYPES)
  secondaryIdType!: IdentityType;

  @IsString()
  @IsNotEmpty()
  secondaryIdNumber!: string;
}

export class UpdateTeamDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  declaredSize?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  collegeName?: string;

  @IsString()
  @IsOptional()
  collegeAddress?: string;

  @IsString()
  @IsOptional()
  viceCaptainName?: string;

  @IsString()
  @IsOptional()
  viceCaptainPhone?: string;

  @IsString()
  @IsOptional()
  coachName?: string;

  @IsString()
  @IsOptional()
  coachPhone?: string;
}

export class JoinTeamDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;

  // College ID is always required and always this type; no client choice.
  @IsString()
  @IsNotEmpty()
  idNumber!: string;

  @IsIn(SECONDARY_IDENTITY_TYPES)
  secondaryIdType!: IdentityType;

  @IsString()
  @IsNotEmpty()
  secondaryIdNumber!: string;
}
