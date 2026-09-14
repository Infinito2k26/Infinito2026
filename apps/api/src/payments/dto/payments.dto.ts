import {
  IsString,
  IsNotEmpty,
  IsUUID,
  IsEnum,
  ValidateIf,
  MaxLength,
} from 'class-validator';

export class SubmitPaymentDto {
  @IsUUID()
  registrationId!: string;

  // UPI UTR (Unique Transaction Reference) no. / bank reference number —
  // not a generic "transaction ID", which UPI payments don't have.
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  utrNumber!: string;

  // Client-generated, stable across retries of the same submission attempt —
  // lets a network retry replay safely instead of creating a duplicate Payment.
  @IsUUID()
  idempotencyKey!: string;
}

export class VerifyPaymentDto {
  @IsEnum(['SUCCESS', 'FAILED'])
  status!: 'SUCCESS' | 'FAILED';

  @ValidateIf((o: VerifyPaymentDto) => o.status === 'FAILED')
  @IsString()
  @IsNotEmpty({
    message: 'rejectionReason is required when rejecting a payment',
  })
  rejectionReason?: string;
}
