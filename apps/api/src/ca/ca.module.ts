import { Module } from '@nestjs/common';
import { CaController } from './ca.controller';
import { CaService } from './ca.service';
import { UploadsModule } from '../uploads/uploads.module';

@Module({
  imports: [UploadsModule],
  controllers: [CaController],
  providers: [CaService],
})
export class CaModule {}
