import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot(databaseConfig),
    TenantModule,
    EmitenteModule,
    CertificadoModule,
    SerieNumeracaoModule,
    NotaFiscalModule,
    EventoFiscalModule,
    WebhookModule,
    SefazModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
