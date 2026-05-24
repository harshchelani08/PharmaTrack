import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'warn', 'error', 'debug'],
  });

  // ── Security Middleware ──────────────────────────────────────────────
  app.use(helmet());

  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-API-Key'],
  });

  // ── Global Validation Pipe ───────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Strip unknown properties
      forbidNonWhitelisted: true,   // Throw on unknown properties
      transform: true,              // Auto-transform payloads to DTO classes
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── Global API Prefix ────────────────────────────────────────────────
  app.setGlobalPrefix('api/v1');

  // ── Swagger / OpenAPI Docs ───────────────────────────────────────────
  const swaggerConfig = new DocumentBuilder()
    .setTitle('PharmaTrack API')
    .setDescription(
      'Enterprise Multi-Tenant Pharmacy Chain SaaS — Complete REST API with RBAC, JWT Auth, and WebSocket support.',
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-Auth',
    )
    .addApiKey({ type: 'apiKey', in: 'header', name: 'X-Tenant-ID' }, 'TenantID')
    .addTag('Auth', 'Authentication and session management')
    .addTag('Tenants', 'Multi-tenant chain management')
    .addTag('Drugs', 'Drug master catalog CRUD')
    .addTag('Batches', 'FEFO batch inventory management')
    .addTag('Dispensing', 'POS billing and invoice generation')
    .addTag('Transfers', 'Inter-branch stock transfers')
    .addTag('Purchase Orders', 'Supplier purchase order workflows')
    .addTag('Reports', 'Analytics and reporting')
    .addTag('Alerts', 'Real-time notification streams')
    .addTag('Billing', 'Stripe subscription management')
    .addTag('Forecast', 'AI demand forecasting and anomaly detection')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  // ── Start Server ─────────────────────────────────────────────────────
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\n🚀 PharmaTrack API is running on: http://localhost:${port}/api/v1`);
  console.log(`📚 Swagger Docs available at:     http://localhost:${port}/api/docs\n`);
}

bootstrap();
