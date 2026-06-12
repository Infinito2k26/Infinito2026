import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

// Replace stub with: import { PrismaClient } from '@prisma/client';
// Then extend PrismaClient instead of the empty class below.
// npm install @prisma/client --workspace=api  (after issue #2 merges)

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // await this.$connect();
  }

  async onModuleDestroy() {
    // await this.$disconnect();
  }
}
