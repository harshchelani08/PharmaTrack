import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

// Extend the Request interface to carry the tenant ID and code context
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenantSubdomain?: string;
    }
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private prisma = new PrismaClient();

  async use(req: Request, res: Response, next: NextFunction) {
    const host = req.headers.host || '';
    let subdomain = '';

    // 1. Resolve subdomain. Expected format: {tenant}.pharmatrack.in
    // Supports local environments like tenant.localhost:3000 as well.
    const parts = host.split('.');
    if (parts.length > 2) {
      subdomain = parts[0].toLowerCase();
    }

    // 2. Fallback to a custom header for API clients or simple local testing
    const tenantHeader = req.headers['x-tenant-id'] as string;
    if (tenantHeader) {
      subdomain = tenantHeader.toLowerCase();
    }

    // Exclude global endpoints
    if (
      req.path.startsWith('/auth/register-tenant') ||
      req.path.startsWith('/billing/webhook') ||
      req.path === '/'
    ) {
      return next();
    }

    if (!subdomain || subdomain === 'www' || subdomain === 'localhost') {
      throw new HttpException(
        'Multi-tenant context missing. Please provide a valid tenant subdomain or X-Tenant-ID header.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3. Query details from database
    const tenant = await this.prisma.tenant.findUnique({
      where: { subdomain },
    });

    if (!tenant) {
      throw new HttpException(
        `Tenant domain '${subdomain}' not found or suspended.`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (tenant.deletedAt) {
      throw new HttpException(
        `Tenant domain '${subdomain}' has been deleted.`,
        HttpStatus.GONE,
      );
    }

    // 4. Attach context to the request thread
    req.tenantId = tenant.id;
    req.tenantSubdomain = tenant.subdomain;

    next();
  }
}
