import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

@Controller('tenants')
@UseGuards(AdminGuard)
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  async create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @Get()
  async findAll() {
    return this.tenantService.findAll();
  }

  @Get(':id')
  async findById(@Param('id') id: string) {
    return this.tenantService.findById(id);
  }
}
