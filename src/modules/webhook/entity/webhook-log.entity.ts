import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { WebhookEventoEnum } from '../enum/webhook-evento.enum';

@Entity({ name: 'webhook_logs' })
export class WebhookLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @Column({ type: 'uuid', nullable: true, name: 'nota_fiscal_id' })
  notaFiscalId: string;

  @Column({ type: 'varchar', length: 500, name: 'url_destino' })
  urlDestino: string;

  @Column({
    type: 'enum',
    enum: WebhookEventoEnum,
  })
  evento: WebhookEventoEnum;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @Column({ type: 'int', nullable: true, name: 'http_status_code' })
  httpStatusCode: number;

  @Column({ type: 'text', nullable: true, name: 'resposta_corpo' })
  respostaCorpo: string;

  @Column({ type: 'boolean', default: false })
  sucesso: boolean;

  @Column({ type: 'int', default: 1 })
  tentativas: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
