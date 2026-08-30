import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { IdentityController } from './identity.controller';
import { IdentityService } from './identity.service';
import { TokenService } from './token.service';

@Module({
  imports: [UploadsModule],
  controllers: [IdentityController],
  providers: [IdentityService, TokenService],
  exports: [IdentityService],
})
export class IdentityModule {}
