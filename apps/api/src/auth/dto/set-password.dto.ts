import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @IsNotEmpty()
  @MinLength(8)
  confirmPassword: string;
}
