import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotaFiscalEntity } from '../nota-fiscal/entity/nota-fiscal.entity';
import { WebhookLogEntity } from '../webhook/entity/webhook-log.entity';
import { LgpdService } from './lgpd.service';
import { LgpdController } from './lgpd.controller';
import { TenantModule } from '../tenant/tenant.module';
import { AuditoriaModule } from '../auditoria/auditoria.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([NotaFiscalEntity, WebhookLogEntity]),
    TenantModule,
    AuditoriaModule,
  ],
  controllers: [LgpdController],
  providers: [LgpdService],
})
export class LgpdModule {}
