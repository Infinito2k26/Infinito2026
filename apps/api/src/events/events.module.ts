import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { AdminEventsController } from './admin-events.controller';
import { RulebooksController } from './rulebooks.controller';
import { AdminRulebooksController } from './admin-rulebooks.controller';
import { EventsService } from './events.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [
    EventsController,
    AdminEventsController,
    RulebooksController,
    AdminRulebooksController,
  ],
  providers: [EventsService],
})
export class EventsModule {}
