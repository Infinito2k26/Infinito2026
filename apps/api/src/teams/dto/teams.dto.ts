import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsUUID,
  IsInt,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { IdentityType } from '@prisma/client';

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

  // Multipart fields arrive as strings ("true"/"false") — Type(() => Boolean)
  // would be wrong here (Boolean("false") is true in JS); an explicit string
  // comparison is required to convert correctly before @IsBoolean() runs.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value === 'true' : value,
  )
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
