import { Controller, Get, Query } from '@nestjs/common';
import { ContentService } from './content.service';

@Controller()
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get('team')
  async listTeam() {
    return this.contentService.listTeamMembers();
  }

  @Get('gallery')
  async listGallery(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.contentService.listGalleryItems(
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get('sponsors')
  async listSponsors() {
    return this.contentService.listPublicSponsors();
  }
}
