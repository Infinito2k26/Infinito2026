import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppConfigModule } from './config/config.module';
import { CommonModule } from './common/common.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [AppConfigModule, CommonModule, HealthModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
