import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { MerchService } from './merch.service';
import {
  CreateProductDto,
  UpdateProductDto,
  PublishProductDto,
  VerifyMerchOrderDto,
  UpdateOrderStatusDto,
} from './dto/merch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/merch')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@SkipThrottle()
export class AdminMerchController {
  constructor(private readonly merchService: MerchService) {}

  @Get('products')
  async listProducts() {
    return this.merchService.listProducts(true);
  }

  @Post('products')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.merchService.createProduct(dto);
  }

  @Patch('products/:id')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.merchService.updateProduct(id, dto);
  }

  @Patch('products/:id/publish')
  async publishProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishProductDto,
  ) {
    return this.merchService.setProductPublished(id, dto.isPublished);
  }

  @Get('orders')
  async listOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.merchService.listOrders(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      status,
    );
  }

  @Patch('orders/:id/verify')
  async verifyOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyMerchOrderDto,
  ) {
    return this.merchService.verifyOrderPayment(id, dto);
  }

  @Patch('orders/:id/status')
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.merchService.updateOrderStatus(id, dto.status);
  }
}
