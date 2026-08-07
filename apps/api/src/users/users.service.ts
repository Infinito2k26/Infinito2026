import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async createPending(data: { email: string; name: string; phone?: string; college?: string }) {
    const existing = await this.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already registered');

    return this.prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        phone: data.phone,
        college: data.college,
        role: 'PARTICIPANT', // default hamesha
        isEmailVerified: false,
      },
    });
  }

  markVerifiedAndSetPassword(email: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { email },
      data: { isEmailVerified: true, passwordHash },
    });
  }

  updatePassword(email: string, passwordHash: string) {
    return this.prisma.user.update({ where: { email }, data: { passwordHash } });
  }
}