import { Body, Controller, Get, Param, Post, Put, UseGuards } from '@nestjs/common';
import { EmitenteService } from './emitente.service';
import { CreateEmitenteDto } from './dto/create-emitente.dto';
import { UpdateEmitenteDto } from './dto/update-emitente.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('emitentes')
@UseGuards(ApiKeyGuard)
export class EmitenteController {
  constructor(private readonly emitenteService: EmitenteService) {}

  @Post()
  async create(@TenantId() tenantId: string, @Body() dto: CreateEmitenteDto) {
    return this.emitenteService.create(tenantId, dto);
  }

  @Get()
  async findAll(@TenantId() tenantId: string) {
    return this.emitenteService.findAllByTenant(tenantId);
  }

  @Get('atual')
  async findAtual(@TenantId() tenantId: string) {
    return this.emitenteService.findFirstByTenant(tenantId);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.emitenteService.findByIdAndTenant(id, tenantId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body() dto: import('./dto/update-emitente.dto').UpdateEmitenteDto,
  ) {
    return this.emitenteService.update(id, tenantId, dto);
  }
}
