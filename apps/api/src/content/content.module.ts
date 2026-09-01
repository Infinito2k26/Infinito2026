import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { AdminContentController } from './admin-content.controller';
import { ContentService } from './content.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [ContentController, AdminContentController],
  providers: [ContentService],
})
export class ContentModule {}
