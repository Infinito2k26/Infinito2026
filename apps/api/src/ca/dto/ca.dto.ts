import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { Transform as TransformDecorator } from 'class-transformer';

export class CaOnboardDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @TransformDecorator(({ value }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  college!: string;
}

export class ReferralClickDto {
  @IsString()
  @IsNotEmpty()
  referralCode!: string;
}

export class SubmitTaskDto {
  @IsString()
  @IsOptional()
  proofUrl?: string;

  @IsString()
  @IsOptional()
  fileUrl?: string;

  @IsString()
  @IsOptional()
  proofNote?: string;
}
