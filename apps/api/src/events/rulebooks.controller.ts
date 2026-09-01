import { Controller, Get, Param } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class RulebooksController {
  constructor(private readonly eventsService: EventsService) {}

  @Get(':slug/rulebooks')
  async list(@Param('slug') slug: string) {
    return this.eventsService.listRulebooksBySlug(slug);
  }
}
