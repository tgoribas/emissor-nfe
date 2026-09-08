import { Module } from '@nestjs/common';
import { SefazXmlBuilderService } from './service/sefaz-xml-builder.service';
import { SefazSignerService } from './service/sefaz-signer.service';
import { SefazClientService } from './service/sefaz-client.service';
import { SefazService } from './sefaz.service';
import { SefazController } from './sefaz.controller';
import { CertificadoModule } from '../certificado/certificado.module';
import { EmitenteModule } from '../emitente/emitente.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [CertificadoModule, EmitenteModule, TenantModule],
  controllers: [SefazController],
  providers: [
    SefazXmlBuilderService,
    SefazSignerService,
    SefazClientService,
    SefazService,
  ],
  exports: [SefazService, SefazXmlBuilderService, SefazSignerService],
})
export class SefazModule {}
