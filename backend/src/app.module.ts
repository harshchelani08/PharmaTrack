import { Module, MiddlewareConsumer, NestModule, RequestMethod } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

// Common infrastructure
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { PrismaService } from './common/services/prisma.service';

// Feature Modules
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { DrugModule } from './modules/drug/drug.module';
import { BatchModule } from './modules/batch/batch.module';
import { DispensingModule } from './modules/dispensing/dispensing.module';
import { TransferModule } from './modules/transfer/transfer.module';
import { PurchaseOrderModule } from './modules/purchase-order/purchase-order.module';
import { SupplierModule } from './modules/supplier/supplier.module';
import { AlertModule } from './modules/alert/alert.module';
import { BillingModule } from './modules/billing/billing.module';
import { ForecastModule } from './modules/forecast/forecast.module';
import { ReportsModule } from './modules/reports/reports.module';

@Module({
  imports: [
    // Global rate limiter: max 100 requests per 60 seconds per IP
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Feature Modules
    AuthModule,
    TenantModule,
    DrugModule,
    BatchModule,
    DispensingModule,
    TransferModule,
    PurchaseOrderModule,
    SupplierModule,
    AlertModule,
    BillingModule,
    ForecastModule,
    ReportsModule,
  ],
  providers: [PrismaService],
  exports: [PrismaService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: 'api/v1/auth/register-tenant', method: RequestMethod.POST },
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/billing/webhook', method: RequestMethod.POST },
        { path: 'api/v1/health', method: RequestMethod.GET },
      )
      .forRoutes('*');
  }
}
