import { Module } from '@nestjs/common';
import { BatchController } from './batch.controller';
import { BatchService } from './batch.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [BatchController],
  providers: [BatchService, PrismaService],
  exports: [BatchService],
})
export class BatchModule {}
