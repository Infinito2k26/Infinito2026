import { Controller, Get, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { IdentityService } from './identity.service';

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
}
