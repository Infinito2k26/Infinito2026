import { IsString, IsOptional, IsISO8601 } from 'class-validator';

export class UpdatePaymentSettingsDto {
  @IsString()
  @IsOptional()
  upiVpa?: string;

  @IsString()
  @IsOptional()
  upiPayeeName?: string;
}

export class UpdateFestDatesDto {
  @IsISO8601()
  @IsOptional()
  festStartAt?: string;

  @IsISO8601()
  @IsOptional()
  festEndAt?: string;

  @IsISO8601()
  @IsOptional()
  registrationCloseAt?: string;

  @IsString()
  @IsOptional()
  dateRangeLabel?: string;
}
