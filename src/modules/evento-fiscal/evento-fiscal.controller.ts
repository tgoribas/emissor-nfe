import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { EventoFiscalService } from './evento-fiscal.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('eventos-fiscais')
@UseGuards(ApiKeyGuard)
export class EventoFiscalController {
  constructor(private readonly eventoService: EventoFiscalService) {}

  @Post()
  async registrar(@TenantId() tenantId: string, @Body() dto: CreateEventoDto) {
    return this.eventoService.registrarEvento(tenantId, dto);
  }

  @Get('nota/:notaFiscalId')
  async findByNota(
    @Param('notaFiscalId') notaFiscalId: string,
    @TenantId() tenantId: string,
  ) {
    return this.eventoService.findByNotaFiscal(notaFiscalId, tenantId);
  }
}
