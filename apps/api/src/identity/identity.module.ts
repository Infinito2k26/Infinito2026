import { Module } from '@nestjs/common';
import { UploadsModule } from '../uploads/uploads.module';
import { IdentityController } from './identity.controller';
import { AdminScansController } from './admin-scans.controller';
import { IdentityService } from './identity.service';
import { TokenService } from './token.service';

@Module({
  imports: [UploadsModule],
  controllers: [IdentityController, AdminScansController],
  providers: [IdentityService, TokenService],
  exports: [IdentityService],
})
export class IdentityModule {}
