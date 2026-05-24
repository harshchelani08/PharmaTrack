import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RoleType } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RbacGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<RoleType[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles are annotated, the route is open to all authenticated users
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user; // Appended by JwtStrategy

    if (!user) {
      throw new HttpException('Authentication required.', HttpStatus.UNAUTHORIZED);
    }

    // 1. Verify User belongs to the active tenant resolving middleware context
    if (user.tenantId !== request.tenantId && user.role !== RoleType.SUPER_ADMIN) {
      throw new HttpException(
        'Access Denied: Tenant boundary violation. Active session does not belong to this subdomain.',
        HttpStatus.FORBIDDEN,
      );
    }

    // 2. Validate Role level matching
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole && user.role !== RoleType.SUPER_ADMIN) {
      throw new HttpException(
        `Access Denied: Required roles: [${requiredRoles.join(', ')}]. Active role: '${user.role}' is insufficient.`,
        HttpStatus.FORBIDDEN,
      );
    }

    return true;
  }
}
