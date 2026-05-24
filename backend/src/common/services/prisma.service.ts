import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Sets the active tenant context for the current transaction/session.
   * This powers PostgreSQL Row-Level Security (RLS).
   */
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(
      `SET LOCAL app.current_tenant_id = '${tenantId}'`
    );
  }

  /**
   * Wraps an operation in a transaction with tenant RLS context set.
   */
  async withTenantTransaction<T>(tenantId: string, fn: (prisma: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}'`);
      return fn(tx as PrismaClient);
    });
  }
}
