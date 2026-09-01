import { Type } from 'class-transformer';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  IsBoolean,
  IsArray,
  IsUUID,
  IsInt,
  ValidateNested,
  IsEnum,
  ValidateIf,
  MaxLength,
} from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  price!: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizesAvailable?: string[];

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}

export class UpdateProductDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  sizesAvailable?: string[];

  @IsBoolean()
  @IsOptional()
  inStock?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  imageUrls?: string[];
}

export class MerchOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @IsOptional()
  size?: string;

  @IsInt()
  @Min(1)
  quantity!: number;
}

export class CreateMerchOrderDto {
  @IsString()
  @IsNotEmpty()
  shippingName!: string;

  @IsString()
  @IsNotEmpty()
  shippingPhone!: string;

  @IsString()
  @IsNotEmpty()
  shippingAddress!: string;

  @IsString()
  @IsNotEmpty()
  shippingPincode!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MerchOrderItemDto)
  items!: MerchOrderItemDto[];
}

export class SubmitOrderPaymentDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  transactionId!: string;

  // Client-generated, stable across retries — same idempotency-replay
  // contract as SubmitPaymentDto.idempotencyKey.
  @IsUUID()
  idempotencyKey!: string;
}

export class VerifyMerchOrderDto {
  @IsEnum(['SUCCESS', 'FAILED'])
  status!: 'SUCCESS' | 'FAILED';

  @ValidateIf((o: VerifyMerchOrderDto) => o.status === 'FAILED')
  @IsString()
  @IsNotEmpty({
    message: 'rejectionReason is required when rejecting a payment',
  })
  rejectionReason?: string;
}

export class UpdateOrderStatusDto {
  @IsEnum(['SHIPPED', 'DELIVERED', 'CANCELLED'])
  status!: 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}
