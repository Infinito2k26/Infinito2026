import { Module } from '@nestjs/common';
import { MerchController } from './merch.controller';
import { AdminMerchController } from './admin-merch.controller';
import { MerchService } from './merch.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [MerchController, AdminMerchController],
  providers: [MerchService],
})
export class MerchModule {}
