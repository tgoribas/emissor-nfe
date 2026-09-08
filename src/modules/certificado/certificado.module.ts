import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CertificadoEntity } from './entity/certificado.entity';
import { CertificadoService } from './certificado.service';
import { CertificadoController } from './certificado.controller';
import { TenantModule } from '../tenant/tenant.module';
import { EmitenteModule } from '../emitente/emitente.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CertificadoEntity]),
    TenantModule,
    EmitenteModule,
  ],
  controllers: [CertificadoController],
  providers: [CertificadoService],
  exports: [CertificadoService],
})
export class CertificadoModule {}
