import { Module } from '@nestjs/common';
import { RegistrationsController } from './registrations.controller';
import { AdminRegistrationsController } from './admin-registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  controllers: [RegistrationsController, AdminRegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
