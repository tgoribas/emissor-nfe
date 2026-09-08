import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookLogEntity } from './entity/webhook-log.entity';
import { WebhookEventoEnum } from './enum/webhook-evento.enum';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookLogEntity)
    private readonly webhookLogRepository: Repository<WebhookLogEntity>,
  ) {}

  async disparar(
    tenantId: string,
    urlDestino: string,
    evento: WebhookEventoEnum,
    payload: Record<string, any>,
    notaFiscalId?: string,
  ): Promise<WebhookLogEntity> {
    const log = this.webhookLogRepository.create({
      tenantId,
      notaFiscalId,
      urlDestino,
      evento,
      payload,
      tentativas: 1,
    });

    try {
      const response = await fetch(urlDestino, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Emissor-NFe-Gateway/1.0',
        },
        body: JSON.stringify({
          evento,
          timestamp: new Date().toISOString(),
          data: payload,
        }),
      });

      log.httpStatusCode = response.status;
      log.sucesso = response.ok;
      log.respostaCorpo = await response.text();
    } catch (error) {
      this.logger.error(`Falha ao disparar webhook para ${urlDestino}: ${error.message}`);
      log.sucesso = false;
      log.respostaCorpo = error.message;
    }

    return this.webhookLogRepository.save(log);
  }

  async findByTenant(tenantId: string): Promise<WebhookLogEntity[]> {
    return this.webhookLogRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }
}
