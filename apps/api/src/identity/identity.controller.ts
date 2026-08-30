import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { IdentityService } from './identity.service';
import { ScanDto } from './dto/scan.dto';

@Controller('identity')
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('mine')
  @UseGuards(JwtAuthGuard)
  async getMine(@Req() req: AuthenticatedRequest) {
    return this.identityService.getMyCredential(req.user.id);
  }

  @Get('validate/:token')
  async validate(@Param('token') token: string) {
    return this.identityService.validateToken(token);
  }

  @Post('scan')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.VOLUNTEER, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  async scan(@Req() req: AuthenticatedRequest, @Body() body: ScanDto) {
    return this.identityService.scan(req.user.id, body);
  }
}
