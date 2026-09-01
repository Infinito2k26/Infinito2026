import { Module } from '@nestjs/common';
import { PaymentsController } from './payments.controller';
import { AdminPaymentsController } from './admin-payments.controller';
import { PaymentsService } from './payments.service';
import { UploadsModule } from '../uploads/uploads.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UploadsModule, QueueModule],
  controllers: [PaymentsController, AdminPaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
