import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SerieNumeracaoEntity } from './entity/serie-numeracao.entity';
import { SerieNumeracaoService } from './serie-numeracao.service';
import { SerieNumeracaoController } from './serie-numeracao.controller';
import { TenantModule } from '../tenant/tenant.module';
import { EmitenteModule } from '../emitente/emitente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SerieNumeracaoEntity]),
    TenantModule,
    EmitenteModule,
  ],
  controllers: [SerieNumeracaoController],
  providers: [SerieNumeracaoService],
  exports: [SerieNumeracaoService],
})
export class SerieNumeracaoModule {}
