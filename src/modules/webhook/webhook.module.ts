import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookLogEntity } from './entity/webhook-log.entity';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookLogEntity]), TenantModule],
  controllers: [WebhookController],
  providers: [WebhookService],
  exports: [WebhookService],
})
export class WebhookModule {}
