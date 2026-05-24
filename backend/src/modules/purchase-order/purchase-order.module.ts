import { Module } from '@nestjs/common';
import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';
import { PrismaService } from '../../common/services/prisma.service';

@Module({
  controllers: [PurchaseOrderController],
  providers: [PurchaseOrderService, PrismaService],
  exports: [PurchaseOrderService],
})
export class PurchaseOrderModule {}
