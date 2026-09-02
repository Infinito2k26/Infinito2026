import {
  Controller,
  Get,
  Patch,
  Body,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PaymentsService } from './payments.service';
import { VerifyPaymentDto } from './dto/payments.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';
import { AdminService } from '@prisma/client';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('admin/payments')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminPaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get()
  @RequirePermission(AdminService.PAYMENTS, 'read')
  async listPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.paymentsService.listPayments(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
      status,
    );
  }

  @Patch(':id/verify')
  @RequirePermission(AdminService.PAYMENTS, 'write')
  async verifyPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: VerifyPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const adminId = req.user.id;

    return this.paymentsService.verifyPayment(id, dto, adminId);
  }
}
