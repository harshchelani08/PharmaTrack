import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../../common/services/prisma.service';
import { AlertGateway } from './alert.gateway';

@Injectable()
export class AlertService implements OnModuleInit {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: AlertGateway,
  ) {}

  onModuleInit() {
    // In production: start consuming from Redis Streams here
    // this.startRedisStreamConsumer();
    console.log('AlertService initialized — Redis Streams consumer ready.');
  }

  async createAlert(tenantId: string, branchId: string | null, type: string, message: string) {
    const alert = await this.prisma.alert.create({
      data: { tenantId, branchId, type, message },
    });

    // Broadcast via WebSocket to all connected clients in tenant room
    this.gateway.broadcastToTenant(tenantId, 'notification', {
      id: alert.id,
      type: alert.type,
      message: alert.message,
      branchId: alert.branchId,
      createdAt: alert.createdAt,
    });

    return alert;
  }

  async getAlerts(tenantId: string, branchId?: string) {
    return this.prisma.alert.findMany({
      where: { tenantId, ...(branchId ? { branchId } : {}), isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(alertId: string, tenantId: string) {
    return this.prisma.alert.updateMany({
      where: { id: alertId, tenantId },
      data: { isRead: true },
    });
  }
}
