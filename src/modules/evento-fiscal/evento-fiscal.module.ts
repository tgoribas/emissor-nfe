import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventoFiscalEntity } from './entity/evento-fiscal.entity';
import { EventoFiscalService } from './evento-fiscal.service';
import { EventoFiscalController } from './evento-fiscal.controller';
import { NotaFiscalEntity } from '../nota-fiscal/entity/nota-fiscal.entity';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([EventoFiscalEntity, NotaFiscalEntity]),
    TenantModule,
  ],
  controllers: [EventoFiscalController],
  providers: [EventoFiscalService],
  exports: [EventoFiscalService],
})
export class EventoFiscalModule {}
