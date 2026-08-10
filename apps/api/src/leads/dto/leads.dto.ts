import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class WaitlistLeadDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  college: string;

  @IsString()
  @IsOptional()
  referralCode?: string;
}
