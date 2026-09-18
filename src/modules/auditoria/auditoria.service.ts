import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Cron } from '@nestjs/schedule';
import { Repository, LessThan } from 'typeorm';
import { createHash } from 'crypto';
import { AuditLogEntity } from './entity/audit-log.entity';

// 5 anos, alinhado ao horizonte de guarda fiscal — auditoria serve a
// fiscalizações futuras e se guarda por mais tempo que logs operacionais
const RETENCAO_DIAS_DEFAULT = 1825;

@Injectable()
export class AuditoriaService implements OnApplicationBootstrap {
  private readonly logger = new Logger(AuditoriaService.name);

  constructor(
    @InjectRepository(AuditLogEntity)
    private readonly auditLogRepository: Repository<AuditLogEntity>,
  ) {}

  onApplicationBootstrap() {
    this.expurgarAntigos().catch((err) =>
      this.logger.error(`Erro no expurgo inicial de audit_logs: ${err.message}`),
    );
  }

  async registrar(dados: Partial<AuditLogEntity>): Promise<void> {
    await this.auditLogRepository.insert(dados);
  }

  hashDocumento(cpfCnpj: string): string {
    return createHash('sha256').update(cpfCnpj.replace(/\D/g, '')).digest('hex');
  }

  // Acessos aos dados do titular: consultas LGPD sobre o documento (via hash)
  // e acessos diretos às notas em que ele figura (via recurso_id)
  async consultarAcessosDoTitular(
    tenantId: string,
    documentoHash: string,
    notaIds: string[],
  ): Promise<AuditLogEntity[]> {
    const qb = this.auditLogRepository
      .createQueryBuilder('log')
      .where('log.tenant_id = :tenantId', { tenantId });

    if (notaIds.length) {
      qb.andWhere('(log.documento_hash = :documentoHash OR log.recurso_id IN (:...notaIds))', {
        documentoHash,
        notaIds,
      });
    } else {
      qb.andWhere('log.documento_hash = :documentoHash', { documentoHash });
    }

    return qb.orderBy('log.created_at', 'DESC').take(100).getMany();
  }

  @Cron('0 4 * * *', { timeZone: 'America/Sao_Paulo' })
  async expurgarAntigos(): Promise<number> {
    const retencaoDias =
      process.env.AUDIT_LOG_RETENTION_DAYS !== undefined
        ? parseInt(process.env.AUDIT_LOG_RETENTION_DAYS, 10)
        : RETENCAO_DIAS_DEFAULT;

    if (!retencaoDias || retencaoDias <= 0) {
      return 0; // 0 desativa o expurgo
    }

    const limite = new Date(Date.now() - retencaoDias * 24 * 60 * 60 * 1000);
    const { affected } = await this.auditLogRepository.delete({
      createdAt: LessThan(limite),
    });

    if (affected) {
      this.logger.log(`Expurgo de retenção: ${affected} audit_logs com mais de ${retencaoDias} dias removidos`);
    }
    return affected ?? 0;
  }
}
