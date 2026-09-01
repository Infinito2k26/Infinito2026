import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { AdminTeamsController } from './admin-teams.controller';
import { TeamsService } from './teams.service';
import { UploadsModule } from '../uploads/uploads.module';
import { QueueModule } from '../queue/queue.module';

@Module({
  imports: [UploadsModule, QueueModule],
  controllers: [TeamsController, AdminTeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
