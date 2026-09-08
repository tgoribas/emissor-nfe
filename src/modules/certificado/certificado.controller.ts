import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CertificadoService } from './certificado.service';
import { UploadCertificadoDto } from './dto/upload-certificado.dto';
import { EmitenteService } from '../emitente/emitente.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('certificados')
@UseGuards(ApiKeyGuard)
export class CertificadoController {
  constructor(
    private readonly certificadoService: CertificadoService,
    private readonly emitenteService: EmitenteService,
  ) {}

  @Post('upload')
  async upload(@TenantId() tenantId: string, @Body() dto: UploadCertificadoDto) {
    // Garante que o emitente pertence ao tenant autenticado
    await this.emitenteService.findByIdAndTenant(dto.emitenteId, tenantId);
    return this.certificadoService.upload(dto);
  }

  @Get(':emitenteId')
  async getStatus(
    @Param('emitenteId') emitenteId: string,
    @TenantId() tenantId: string,
  ) {
    await this.emitenteService.findByIdAndTenant(emitenteId, tenantId);
    return this.certificadoService.findByEmitente(emitenteId);
  }
}
