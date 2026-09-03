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
import { AdminService } from '@prisma/client';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  PublishEventDto,
} from './dto/events.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermission } from '../common/decorators/require-permission.decorator';

@Controller('admin/events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@SkipThrottle()
export class AdminEventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @RequirePermission(AdminService.EVENTS, 'read')
  async list(@Query('page') page?: string, @Query('limit') limit?: string) {
    const parsedPage = page ? Number(page) : 1;
    const parsedLimit = limit ? Number(limit) : 20;

    return this.eventsService.listAll(
      Number.isFinite(parsedPage) ? parsedPage : 1,
      Number.isFinite(parsedLimit) ? parsedLimit : 20,
    );
  }

  @Get(':id')
  @RequirePermission(AdminService.EVENTS, 'read')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.eventsService.findById(id);
  }

  @Post()
  @RequirePermission(AdminService.EVENTS, 'write')
  async create(@Body() dto: CreateEventDto) {
    return this.eventsService.create(dto);
  }

  @Patch(':id')
  @RequirePermission(AdminService.EVENTS, 'write')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, dto);
  }

  @Patch(':id/publish')
  @RequirePermission(AdminService.EVENTS, 'write')
  async publish(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: PublishEventDto,
  ) {
    return this.eventsService.setPublished(id, dto.isPublished);
  }
}
