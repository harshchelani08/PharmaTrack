import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/services/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registerTenant(dto: any) {
    // Check subdomain is not taken
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { subdomain: dto.subdomain.toLowerCase() },
    });
    if (existingTenant) {
      throw new ConflictException(`Subdomain '${dto.subdomain}' is already registered.`);
    }

    // Create tenant + admin user in one transaction
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: dto.tenantName, subdomain: dto.subdomain.toLowerCase() },
      });

      const passwordHash = await bcrypt.hash(dto.adminPassword, 12);
      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: 'CHAIN_OWNER',
        },
      });

      const tokens = this.generateTokens(user.id, user.email, user.role, tenant.id);
      return { tenant, user: { id: user.id, email: user.email, role: user.role }, ...tokens };
    });
  }

  async login(dto: any, tenantId: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email.toLowerCase(), tenantId, deletedAt: null },
    });

    if (!user) throw new UnauthorizedException('Invalid credentials.');

    const isValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isValid) throw new UnauthorizedException('Invalid credentials.');

    const tokens = this.generateTokens(user.id, user.email, user.role, user.tenantId);
    return {
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, branchId: user.branchId, tenantId: user.tenantId },
      ...tokens,
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user || user.deletedAt) throw new UnauthorizedException('Token invalid.');
      return this.generateTokens(user.id, user.email, user.role, user.tenantId);
    } catch {
      throw new UnauthorizedException('Refresh token is expired or invalid.');
    }
  }

  private generateTokens(userId: string, email: string, role: string, tenantId: string) {
    const payload = { sub: userId, email, role, tenantId };
    return {
      accessToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
      }),
      refreshToken: this.jwtService.sign(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
      }),
    };
  }
}
