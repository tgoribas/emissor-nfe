import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { LgpdService } from './lgpd.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { TitularLgpdDto } from './dto/titular-lgpd.dto';

/**
 * Direitos do titular (Art. 18 LGPD), escopados ao tenant autenticado.
 * O tenant é o controlador; estes endpoints são os meios para ele atender
 * pedidos dos titulares sobre os dados tratados NESTE gateway.
 */
@Controller('lgpd')
@UseGuards(ApiKeyGuard)
export class LgpdController {
  constructor(private readonly lgpdService: LgpdService) {}

  // Confirmação, acesso e portabilidade (Art. 18, I, II e V)
  @Get('titular')
  async consultarTitular(@TenantId() tenantId: string, @Query() dto: TitularLgpdDto) {
    return this.lgpdService.consultarTitular(tenantId, dto.cpfCnpj);
  }

  // Anonimização das cópias sem obrigação legal de guarda (Art. 18, IV)
  @Post('titular/anonimizar')
  async anonimizarTitular(@TenantId() tenantId: string, @Body() dto: TitularLgpdDto) {
    return this.lgpdService.anonimizarTitular(tenantId, dto.cpfCnpj);
  }
}
