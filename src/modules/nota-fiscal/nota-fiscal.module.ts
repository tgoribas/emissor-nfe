import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotaFiscalEntity } from './entity/nota-fiscal.entity';
import { EventoFiscalEntity } from '../evento-fiscal/entity/evento-fiscal.entity';
import { NotaFiscalService } from './nota-fiscal.service';
import { NotaFiscalController } from './nota-fiscal.controller';
import { DanfeService } from './service/danfe.service';
import { SerieNumeracaoModule } from '../serie-numeracao/serie-numeracao.module';
import { EmitenteModule } from '../emitente/emitente.module';
import { SefazModule } from '../sefaz/sefaz.module';
import { TenantModule } from '../tenant/tenant.module';
import { WebhookModule } from '../webhook/webhook.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotaFiscalEntity, EventoFiscalEntity]),
    SerieNumeracaoModule,
    EmitenteModule,
    SefazModule,
    TenantModule,
    WebhookModule,
  ],
  controllers: [NotaFiscalController],
  providers: [NotaFiscalService, DanfeService],
  exports: [NotaFiscalService, DanfeService],
})
export class NotaFiscalModule {}
