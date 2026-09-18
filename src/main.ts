import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const logger = new Logger('Bootstrap');

  // Headers de segurança (X-Content-Type-Options, HSTS, etc.)
  app.use(helmet());

  // Necessário atrás de proxy reverso para o rate limiting enxergar o IP real
  if (process.env.TRUST_PROXY === 'true') {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  // Configuração global de validação dos DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS por allowlist (CORS_ORIGINS, separado por vírgula).
  // Sem allowlist: aberto em dev; bloqueado em produção.
  const corsOrigins = process.env.CORS_ORIGINS?.split(',').map((o) => o.trim()).filter(Boolean);
  const isProduction = process.env.NODE_ENV === 'production';
  if (!corsOrigins?.length && isProduction) {
    logger.warn('CORS_ORIGINS não definida em produção — requisições cross-origin bloqueadas');
  }
  app.enableCors({
    origin: corsOrigins?.length ? corsOrigins : isProduction ? false : '*',
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'x-tenant-id', 'x-api-key', 'Authorization'],
  });

  // Prefixo global da API
  app.setGlobalPrefix('api/v1');

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`🚀 Gateway de NF-e rodando na porta ${port} [http://localhost:${port}/api/v1]`);
}

bootstrap();
