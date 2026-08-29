import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
} from 'class-validator';
import { IdentityType } from '@prisma/client';

export class CreateTeamDto {
  @IsUUID()
  eventId!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  collegeName!: string;

  @IsString()
  @IsOptional()
  collegeAddress?: string;

  @IsBoolean()
  @IsOptional()
  isIITP?: boolean;

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
  @IsEnum(IdentityType)
  idType!: IdentityType;

  @IsString()
  @IsNotEmpty()
  idNumber!: string;
}

export class JoinTeamDto {
  @IsString()
  @IsNotEmpty()
  inviteCode!: string;

  @IsEnum(IdentityType)
  idType!: IdentityType;

  @IsString()
  @IsNotEmpty()
  idNumber!: string;
}
