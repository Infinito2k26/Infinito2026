import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WaitlistLeadDto } from './dto/leads.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async joinWaitlist(dto: WaitlistLeadDto) {
    return this.prisma.caReferralLead.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        college: dto.college,
        referralCode: dto.referralCode,
      },
    });
  }
}
