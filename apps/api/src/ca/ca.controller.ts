import {
  Controller,
  Post,
  Body,
  Req,
  UseGuards,
  Ip,
  HttpCode,
  HttpStatus,
  Get,
  Param,
} from '@nestjs/common';
import { CaService } from './ca.service';
import { CaOnboardDto, ReferralClickDto, SubmitTaskDto } from './dto/ca.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';

@Controller('ca')
export class CaController {
  constructor(private readonly caService: CaService) {}

  @Post('onboard')
  @UseGuards(JwtAuthGuard)
  async onboard(@Req() req: AuthenticatedRequest, @Body() body: CaOnboardDto) {
    const userId = req.user.id;
    return await this.caService.onboard(userId, body.college);
  }

  @Post('referral/click')
  @HttpCode(HttpStatus.OK)
  async referralClick(@Body() body: ReferralClickDto, @Ip() ip: string) {
    return await this.caService.recordClick(body.referralCode, ip || 'unknown');
  }

  @Get('tasks')
  @UseGuards(JwtAuthGuard)
  async getTasks(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return await this.caService.getTasks(userId);
  }

  @Post('tasks/:taskId/submit')
  @UseGuards(JwtAuthGuard)
  async submitTask(
    @Req() req: AuthenticatedRequest,
    @Param('taskId') taskId: string,
    @Body() body: SubmitTaskDto,
  ) {
    const userId = req.user.id;
    return await this.caService.submitTask(
      userId,
      taskId,
      body.proofUrl,
      body.fileUrl,
      body.proofNote,
    );
  }
}
