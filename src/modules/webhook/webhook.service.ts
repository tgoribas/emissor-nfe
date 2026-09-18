import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository, LessThan } from 'typeorm';
import { WebhookLogEntity } from './entity/webhook-log.entity';
import { WebhookEventoEnum } from './enum/webhook-evento.enum';

// Logs de webhook carregam dados pessoais (CPF/endereço do destinatário) sem
// obrigação legal de guarda — expurgo após o prazo atende os Arts. 15-16 da LGPD
const RETENCAO_DIAS_DEFAULT = 90;
const RESPOSTA_CORPO_MAX_CHARS = 1000;

@Injectable()
export class WebhookService implements OnApplicationBootstrap {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    @InjectRepository(WebhookLogEntity)
    private readonly webhookLogRepository: Repository<WebhookLogEntity>,
  ) {}

  onApplicationBootstrap() {
    // Garante o expurgo também em instâncias que não atravessam o horário do cron
    this.expurgarLogsAntigos().catch((err) =>
      this.logger.error(`Erro no expurgo inicial de webhook_logs: ${err.message}`),
    );
  }

  @Cron('0 3 * * *', { timeZone: 'America/Sao_Paulo' })
  async expurgarLogsAntigos(): Promise<number> {
    const retencaoDias =
      process.env.WEBHOOK_LOG_RETENTION_DAYS !== undefined
        ? parseInt(process.env.WEBHOOK_LOG_RETENTION_DAYS, 10)
        : RETENCAO_DIAS_DEFAULT;

    if (!retencaoDias || retencaoDias <= 0) {
      return 0; // 0 desativa o expurgo
    }

    const limite = new Date(Date.now() - retencaoDias * 24 * 60 * 60 * 1000);
    const { affected } = await this.webhookLogRepository.delete({
      createdAt: LessThan(limite),
    });

    if (affected) {
      this.logger.log(`Expurgo de retenção: ${affected} webhook_logs com mais de ${retencaoDias} dias removidos`);
    }
    return affected ?? 0;
  }

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
      log.respostaCorpo = (await response.text()).slice(0, RESPOSTA_CORPO_MAX_CHARS);
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
