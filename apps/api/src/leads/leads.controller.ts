import { Controller, Post, Body } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { WaitlistLeadDto } from './dto/leads.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('waitlist')
  async waitlist(@Body() body: WaitlistLeadDto) {
    return this.leadsService.joinWaitlist(body);
  }
}
