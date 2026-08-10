import { IsString, IsNotEmpty, IsIn, IsOptional } from 'class-validator';

export const PARTICIPATING_COLLEGES = [
  'IIT Patna',
  'NIT Patna',
  'BIT Mesra',
  'AMU',
  'Other',
];

export class CaOnboardDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(PARTICIPATING_COLLEGES)
  college: string;
}

export class ReferralClickDto {
  @IsString()
  @IsNotEmpty()
  referralCode: string;
}

export class SubmitTaskDto {
  @IsString()
  @IsOptional()
  proofUrl?: string; // We will validate this server-side manually or with standard class-validator

  @IsString()
  @IsOptional()
  fileUrl?: string; // Usually you'd use a file upload interceptor, but if we receive a URL from a pre-signed S3 upload:

  @IsString()
  @IsOptional()
  proofNote?: string;
}
