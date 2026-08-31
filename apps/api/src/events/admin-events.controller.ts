import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  PublishEventDto,
} from './dto/events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@SkipThrottle()
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.eventsService.listAll(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }

  @Post()
  async create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto);
  }

  @Patch(':id/publish')
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishEventDto,
  ) {
    return this.eventsService.setPublished(id, dto.isPublished);
  }
}
