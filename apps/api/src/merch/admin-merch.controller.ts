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
import { AdminService } from '@prisma/client';
import { MerchService } from './merch.service';
import {
  CreateProductDto,
  UpdateProductDto,
  PublishProductDto,
  VerifyMerchOrderDto,
  UpdateOrderStatusDto,
} from './dto/merch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('admin/merch')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminMerchController {
  constructor(private readonly merchService: MerchService) {}

  @Get('products')
  @RequirePermission(AdminService.MERCH, 'read')
  async listProducts() {
    return this.merchService.listProducts(true);
  }

  @Post('products')
  @RequirePermission(AdminService.MERCH, 'write')
  async createProduct(@Body() dto: CreateProductDto) {
    return this.merchService.createProduct(dto);
  }

  @Patch('products/:id')
  @RequirePermission(AdminService.MERCH, 'write')
  async updateProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.merchService.updateProduct(id, dto);
  }

  @Patch('products/:id/publish')
  @RequirePermission(AdminService.MERCH, 'write')
  async publishProduct(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishProductDto,
  ) {
    return this.merchService.setProductPublished(id, dto.isPublished);
  }

  @Get('orders')
  @RequirePermission(AdminService.MERCH, 'read')
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
  @RequirePermission(AdminService.MERCH, 'write')
  async verifyOrder(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyMerchOrderDto,
  ) {
    return this.merchService.verifyOrderPayment(id, dto);
  }

  @Patch('orders/:id/status')
  @RequirePermission(AdminService.MERCH, 'write')
  async updateOrderStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.merchService.updateOrderStatus(id, dto.status);
  }
}
