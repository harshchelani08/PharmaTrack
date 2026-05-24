import { Module } from '@nestjs/common';
import { AlertGateway } from './alert.gateway';
import { AlertService } from './alert.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  providers: [AlertGateway, AlertService, PrismaService],
  exports: [AlertService],
})
export class AlertModule {}
