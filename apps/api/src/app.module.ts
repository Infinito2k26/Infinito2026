import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppConfigModule } from './config/config.module';
import { Env } from './config/env.schema';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { QueueModule } from './queue/queue.module';
import { RedisModule } from './redis/redis.module';
import { AuthModule } from './auth/auth.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CaModule } from './ca/ca.module';
import { LeadsModule } from './leads/leads.module';
import { AdminModule } from './admin/admin.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { RegistrationsModule } from './registrations/registrations.module';
import { PaymentsModule } from './payments/payments.module';
import { IdentityModule } from './identity/identity.module';
import { EventsModule } from './events/events.module';
import { TeamsModule } from './teams/teams.module';
import { ContentModule } from './content/content.module';

@Module({
  imports: [
    AppConfigModule,
    CommonModule,
    RedisModule,
    QueueModule,
    HealthModule,
    PrismaModule,
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => [
        {
          ttl: config.get('THROTTLE_TTL_MS', { infer: true }),
          limit: config.get('THROTTLE_LIMIT', { infer: true }),
        },
      ],
    }),
    AuthModule,
    CaModule,
    LeadsModule,
    AdminModule,
    LeaderboardModule,
    RegistrationsModule,
    PaymentsModule,
    IdentityModule,
    EventsModule,
    TeamsModule,
    ContentModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
