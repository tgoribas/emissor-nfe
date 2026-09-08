import { Controller, Get, UseGuards } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('webhooks')
@UseGuards(ApiKeyGuard)
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get('logs')
  async getLogs(@TenantId() tenantId: string) {
    return this.webhookService.findByTenant(tenantId);
  }
}
