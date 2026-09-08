import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { SefazService } from './sefaz.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('sefaz')
@UseGuards(ApiKeyGuard)
export class SefazController {
  constructor(private readonly sefazService: SefazService) {}

  @Get('status/:emitenteId')
  async consultarStatus(
    @Param('emitenteId') emitenteId: string,
    @TenantId() tenantId: string,
  ) {
    return this.sefazService.consultarStatusServico(emitenteId, tenantId);
  }
}
