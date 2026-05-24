import { Module } from '@nestjs/common';
import { ForecastController } from './forecast.controller';
import { ForecastService } from './forecast.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [ForecastController],
  providers: [ForecastService, PrismaService],
  exports: [ForecastService],
})
export class ForecastModule {}
