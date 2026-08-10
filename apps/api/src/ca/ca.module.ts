import { Module } from '@nestjs/common';
import { CaController } from './ca.controller';
import { CaService } from './ca.service';

@Module({
  controllers: [CaController],
  providers: [CaService],
})
export class CaModule {}
