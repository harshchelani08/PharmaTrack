import { Module } from '@nestjs/common';
import { DispensingController } from './dispensing.controller';
import { DispensingService } from './dispensing.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [DispensingController],
  providers: [DispensingService, PrismaService],
  exports: [DispensingService],
})
export class DispensingModule {}
