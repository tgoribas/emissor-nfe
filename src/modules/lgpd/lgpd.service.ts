import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotaFiscalEntity } from '../nota-fiscal/entity/nota-fiscal.entity';
import { WebhookLogEntity } from '../webhook/entity/webhook-log.entity';
import { AuditoriaService } from '../auditoria/auditoria.service';

const MASCARA = 'ANONIMIZADO';

// Campos de pessoa natural nos objetos destinatario/transporte do payload.
// municipio/uf/codigoMunicipioIbge ficam: não identificam o titular isoladamente.
const CAMPOS_PESSOAIS = [
  'cpfCnpj',
  'cnpjCpf',
  'nome',
  'inscricaoEstadual',
  'logradouro',
  'numero',
  'complemento',
  'bairro',
  'cep',
  'telefone',
  'email',
  'endereco',
  'placaVeiculo',
];

const RETENCAO_XML =
  'Retido por obrigação legal — guarda fiscal mínima de 5 anos (Art. 16, I, LGPD c/c legislação tributária)';
const RETENCAO_PAYLOAD =
  'Cópia operacional sem obrigação legal de guarda — elegível a anonimização mediante pedido do titular';

@Injectable()
export class LgpdService {
  private readonly logger = new Logger(LgpdService.name);

  constructor(
    @InjectRepository(NotaFiscalEntity)
    private readonly notaFiscalRepository: Repository<NotaFiscalEntity>,
    @InjectRepository(WebhookLogEntity)
    private readonly webhookLogRepository: Repository<WebhookLogEntity>,
    private readonly auditoriaService: AuditoriaService,
  ) {}

  async consultarTitular(tenantId: string, cpfCnpj: string) {
    const documento = this.normalizarDocumento(cpfCnpj);
    const notas = await this.buscarNotasDoTitular(tenantId, documento);
    const logs = await this.buscarWebhookLogsDoTitular(tenantId, documento);

    // Art. 37: acessos já registrados aos dados deste titular no escopo do tenant
    const acessos = await this.auditoriaService.consultarAcessosDoTitular(
      tenantId,
      this.auditoriaService.hashDocumento(documento),
      notas.map((nota) => nota.id),
    );

    return {
      documento,
      geradoEm: new Date().toISOString(),
      notasFiscais: notas.map((nota) => ({
        id: nota.id,
        chaveAcesso: nota.chaveAcesso,
        serie: nota.serie,
        numero: nota.numero,
        status: nota.status,
        dhAutorizacao: nota.dhAutorizacao,
        ondeAparece: this.ondeAparece(nota, documento),
        retencao: {
          xmlFiscal: RETENCAO_XML,
          payloadOriginal: RETENCAO_PAYLOAD,
        },
      })),
      webhookLogs: logs.map((log) => ({
        id: log.id,
        evento: log.evento,
        urlDestino: log.urlDestino,
        criadoEm: log.createdAt,
      })),
      retencaoWebhookLogs: `Expurgo automático após ${process.env.WEBHOOK_LOG_RETENTION_DAYS || 90} dias; elegível a anonimização imediata`,
      acessosAosSeusDados: acessos.map((acesso) => ({
        em: acesso.createdAt,
        metodo: acesso.metodo,
        rota: acesso.rota,
        credencial: acesso.credencial,
        ip: acesso.ip,
        sucesso: acesso.sucesso,
      })),
      compartilhamentos: [
        'SEFAZ — transmissão da NF-e (obrigação legal, Art. 7º, II, LGPD)',
        ...(logs.length ? ['Endpoint de webhook configurado pelo próprio tenant'] : []),
      ],
    };
  }

  async anonimizarTitular(tenantId: string, cpfCnpj: string) {
    const documento = this.normalizarDocumento(cpfCnpj);
    const variantes = this.variantesDocumento(documento);

    const notas = await this.buscarNotasDoTitular(tenantId, documento);
    for (const nota of notas) {
      const payload = nota.payloadOriginal;
      if (this.documentoBate(payload?.destinatario?.cpfCnpj, documento)) {
        this.mascararCamposPessoais(payload.destinatario);
      }
      if (this.documentoBate(payload?.transporte?.cnpjCpf, documento)) {
        this.mascararCamposPessoais(payload.transporte);
      }
      await this.notaFiscalRepository.update(nota.id, { payloadOriginal: payload });
    }

    const logs = await this.buscarWebhookLogsDoTitular(tenantId, documento);
    for (const log of logs) {
      this.mascararJson(log.payload, documento, variantes);
      await this.webhookLogRepository.update(log.id, { payload: log.payload });
    }

    this.logger.log(
      `Anonimização LGPD executada para tenant ${tenantId}: ${notas.length} payloads de nota e ${logs.length} webhook_logs`,
    );

    return {
      documento,
      executadoEm: new Date().toISOString(),
      notasFiscaisAnonimizadas: notas.length,
      webhookLogsAnonimizados: logs.length,
      mantidoPorObrigacaoLegal:
        'XMLs fiscais (gerado/assinado/protocolado) e chave de acesso das notas foram mantidos: ' + RETENCAO_XML,
    };
  }

  private normalizarDocumento(cpfCnpj: string): string {
    const documento = (cpfCnpj || '').replace(/\D/g, '');
    if (documento.length !== 11 && documento.length !== 14) {
      throw new BadRequestException('cpfCnpj deve conter 11 (CPF) ou 14 (CNPJ) dígitos');
    }
    return documento;
  }

  // Variantes com e sem pontuação, para busca textual nos payloads de webhook
  private variantesDocumento(documento: string): string[] {
    const formatado =
      documento.length === 11
        ? `${documento.slice(0, 3)}.${documento.slice(3, 6)}.${documento.slice(6, 9)}-${documento.slice(9)}`
        : `${documento.slice(0, 2)}.${documento.slice(2, 5)}.${documento.slice(5, 8)}/${documento.slice(8, 12)}-${documento.slice(12)}`;
    return [documento, formatado];
  }

  private documentoBate(valor: unknown, documento: string): boolean {
    return typeof valor === 'string' && valor.replace(/\D/g, '') === documento;
  }

  private buscarNotasDoTitular(tenantId: string, documento: string): Promise<NotaFiscalEntity[]> {
    return this.notaFiscalRepository
      .createQueryBuilder('nota')
      .where('nota.tenant_id = :tenantId', { tenantId })
      .andWhere(
        `(regexp_replace(COALESCE(nota.payload_original->'destinatario'->>'cpfCnpj', ''), '\\D', '', 'g') = :documento
          OR regexp_replace(COALESCE(nota.payload_original->'transporte'->>'cnpjCpf', ''), '\\D', '', 'g') = :documento)`,
        { documento },
      )
      .orderBy('nota.created_at', 'DESC')
      .getMany();
  }

  private buscarWebhookLogsDoTitular(tenantId: string, documento: string): Promise<WebhookLogEntity[]> {
    const padroes = this.variantesDocumento(documento).map((v) => `%${v}%`);
    return this.webhookLogRepository
      .createQueryBuilder('log')
      .where('log.tenant_id = :tenantId', { tenantId })
      .andWhere('log.payload::text LIKE ANY (:padroes)', { padroes })
      .orderBy('log.created_at', 'DESC')
      .getMany();
  }

  private ondeAparece(nota: NotaFiscalEntity, documento: string): string[] {
    const locais: string[] = [];
    if (this.documentoBate(nota.payloadOriginal?.destinatario?.cpfCnpj, documento)) {
      locais.push('destinatario');
    }
    if (this.documentoBate(nota.payloadOriginal?.transporte?.cnpjCpf, documento)) {
      locais.push('transporte');
    }
    return locais;
  }

  private mascararCamposPessoais(objeto: Record<string, any>): void {
    for (const campo of CAMPOS_PESSOAIS) {
      if (objeto[campo] !== undefined && objeto[campo] !== null) {
        objeto[campo] = MASCARA;
      }
    }
  }

  // Percorre o JSON do webhook: objetos cujo cpfCnpj/cnpjCpf bate com o documento
  // têm os campos pessoais mascarados; qualquer string contendo o documento é substituída.
  private mascararJson(valor: any, documento: string, variantes: string[]): void {
    if (Array.isArray(valor)) {
      valor.forEach((item) => this.mascararJson(item, documento, variantes));
      return;
    }
    if (valor === null || typeof valor !== 'object') {
      return;
    }
    if (
      this.documentoBate(valor.cpfCnpj, documento) ||
      this.documentoBate(valor.cnpjCpf, documento)
    ) {
      this.mascararCamposPessoais(valor);
    }
    for (const [chave, filho] of Object.entries(valor)) {
      if (typeof filho === 'string' && variantes.some((v) => filho.includes(v))) {
        valor[chave] = MASCARA;
      } else {
        this.mascararJson(filho, documento, variantes);
      }
    }
  }
}
