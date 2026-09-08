import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { SerieNumeracaoService } from './serie-numeracao.service';
import { CreateSerieDto } from './dto/create-serie.dto';
import { EmitenteService } from '../emitente/emitente.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { TipoDocumentoFiscalEnum } from './enum/tipo-documento-fiscal.enum';

@Controller('series-numeracao')
@UseGuards(ApiKeyGuard)
export class SerieNumeracaoController {
  constructor(
    private readonly serieService: SerieNumeracaoService,
    private readonly emitenteService: EmitenteService,
  ) {}

  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: CreateSerieDto) {
    // Garante que o emitente pertence ao tenant autenticado
    await this.emitenteService.findByIdAndTenant(dto.emitenteId, tenantId);
    return this.serieService.create(dto);
  }

  @Get(':emitenteId')
  async findByEmitente(
    @Param('emitenteId') emitenteId: string,
    @TenantId() tenantId: string,
  ) {
    await this.emitenteService.findByIdAndTenant(emitenteId, tenantId);
    return this.serieService.findByEmitente(emitenteId);
  }

  @Post(':emitenteId/sincronizar-numero')
  async sincronizarNumero(
    @Param('emitenteId') emitenteId: string,
    @TenantId() tenantId: string,
    @Body() body: { serie: number; ultimoNumero: number; tipoDocumento?: TipoDocumentoFiscalEnum },
  ) {
    await this.emitenteService.findByIdAndTenant(emitenteId, tenantId);
    return this.serieService.updateNumero(
      emitenteId,
      body.serie || 1,
      body.tipoDocumento || TipoDocumentoFiscalEnum.NFE,
      body.ultimoNumero,
    );
  }
}
