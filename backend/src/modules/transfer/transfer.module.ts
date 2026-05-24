import { Module } from '@nestjs/common';
import { TransferController } from './transfer.controller';
import { TransferService } from './transfer.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [TransferController],
  providers: [TransferService, PrismaService],
  exports: [TransferService],
})
export class TransferModule {}
