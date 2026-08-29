import { Controller, Get, Param, Query } from '@nestjs/common';
import { EventsService } from './events.service';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.eventsService.listPublished(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get(':slug')
  async detail(@Param('slug') slug: string) {
    return this.eventsService.findBySlug(slug);
  }
}
