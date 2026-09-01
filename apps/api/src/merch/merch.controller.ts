import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseFilePipeBuilder,
  ParseUUIDPipe,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MerchService } from './merch.service';
import { CreateMerchOrderDto, SubmitOrderPaymentDto } from './dto/merch.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('merch')
export class MerchController {
  constructor(private readonly merchService: MerchService) {}

  @Get('products')
  async listProducts() {
    return this.merchService.listProducts(false);
  }

  @Get('products/:id')
  async getProduct(@Param('id', ParseUUIDPipe) id: string) {
    return this.merchService.findProductById(id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateMerchOrderDto,
  ) {
    return this.merchService.createOrder(req.user.id, dto);
  }

  @Get('orders/mine')
  @UseGuards(JwtAuthGuard)
  async listMyOrders(@Req() req: AuthenticatedRequest) {
    return this.merchService.listMyOrders(req.user.id);
  }

  @Post('orders/:id/payment')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async submitOrderPayment(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SubmitOrderPaymentDto,
    @UploadedFile(
      new ParseFilePipeBuilder()
        .addFileTypeValidator({
          fileType: /^(image\/jpeg|image\/png|image\/webp)$/,
        })
        .build({
          fileIsRequired: true,
          errorHttpStatusCode: HttpStatus.BAD_REQUEST,
        }),
    )
    file: Express.Multer.File,
  ) {
    return this.merchService.submitOrderPayment(req.user.id, id, dto, file);
  }
}
