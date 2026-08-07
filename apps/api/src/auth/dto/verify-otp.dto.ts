import { IsEmail, IsString, Length, IsNotEmpty } from 'class-validator';

export class VerifyOtpDto {
  @IsEmail()
  @IsNotEmpty() 
  email: string;

  @IsString() 
  @Length(6, 6)
  @IsNotEmpty()
   otp: string;
}