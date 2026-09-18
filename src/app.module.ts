import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { databaseConfig } from './config/database.config';
import { AppController } from './app.controller';
import { TenantModule } from './modules/tenant/tenant.module';
import { EmitenteModule } from './modules/emitente/emitente.module';
import { CertificadoModule } from './modules/certificado/certificado.module';
import { SerieNumeracaoModule } from './modules/serie-numeracao/serie-numeracao.module';
import { NotaFiscalModule } from './modules/nota-fiscal/nota-fiscal.module';
import { EventoFiscalModule } from './modules/evento-fiscal/evento-fiscal.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { SefazModule } from './modules/sefaz/sefaz.module';
import { LgpdModule } from './modules/lgpd/lgpd.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { AuditoriaMiddleware } from './modules/auditoria/auditoria.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // Rate limiting por IP — barra força bruta no x-api-key antes dos guards
    ThrottlerModule.forRoot([
      {
        ttl: (parseInt(process.env.THROTTLE_TTL, 10) || 60) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 120,
      },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot(databaseConfig),
    TenantModule,
    EmitenteModule,
    CertificadoModule,
    SerieNumeracaoModule,
    NotaFiscalModule,
    EventoFiscalModule,
    WebhookModule,
    SefazModule,
    LgpdModule,
    AuditoriaModule,
  ],
  controllers: [AppController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Trilha de auditoria (Art. 37 LGPD) em todas as rotas da API
    consumer.apply(AuditoriaMiddleware).forRoutes('*');
  }
}
