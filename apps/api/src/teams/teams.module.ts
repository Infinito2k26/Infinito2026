import { Module } from '@nestjs/common';
import { TeamsController } from './teams.controller';
import { AdminTeamsController } from './admin-teams.controller';
import { TeamsService } from './teams.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [TeamsController, AdminTeamsController],
  providers: [TeamsService],
})
export class TeamsModule {}
