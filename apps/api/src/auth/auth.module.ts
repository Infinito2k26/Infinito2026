import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RedisRefreshTokenStore } from './redis-refresh-token-store';
import { REFRESH_TOKEN_STORE } from './refresh-token-store.interface';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [PassportModule, JwtModule.register({})],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: REFRESH_TOKEN_STORE, useClass: RedisRefreshTokenStore },
  ],
})
export class AuthModule {}
