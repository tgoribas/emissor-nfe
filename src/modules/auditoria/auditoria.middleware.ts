import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuditoriaService } from './auditoria.service';
import { CredencialAuditoriaEnum } from './enum/credencial-auditoria.enum';

const PREFIXO_API = '/api/v1/';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Grava a trilha de auditoria (Art. 37 LGPD) no fim de cada resposta.
 * Roda antes dos guards, então captura também tentativas negadas (401/403),
 * que interceptors não veem. A escrita é fire-and-forget: nunca adiciona
 * latência nem derruba a requisição.
 */
@Injectable()
export class AuditoriaMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuditoriaMiddleware.name);

  constructor(private readonly auditoriaService: AuditoriaService) {}

  use(req: Request, res: Response, next: NextFunction) {
    res.on('finish', () => {
      try {
        this.registrarAcesso(req, res);
      } catch (err) {
        this.logger.error(`Falha ao montar registro de auditoria: ${err.message}`);
      }
    });
    next();
  }

  private registrarAcesso(req: Request, res: Response) {
    // Sem query string: a query de /lgpd/titular carrega o CPF em claro
    const rota = (req.originalUrl || req.url).split('?')[0];

    // Fora do escopo: preflight, rota raiz (health) e paths fora da API
    if (req.method === 'OPTIONS' || !rota.startsWith(PREFIXO_API)) {
      return;
    }

    const segmentos = rota.slice(PREFIXO_API.length).split('/').filter(Boolean);
    if (!segmentos.length) {
      return;
    }

    const tenantId: string | null = (req as any).tenantId || null;
    const negada = res.statusCode === 401 || res.statusCode === 403;
    const credencial = tenantId
      ? CredencialAuditoriaEnum.TENANT
      : req.headers['x-admin-key'] && !negada
        ? CredencialAuditoriaEnum.ADMIN
        : CredencialAuditoriaEnum.NAO_AUTENTICADA;

    let documentoHash: string | null = null;
    if (segmentos[0] === 'lgpd') {
      const documento = (req.query?.cpfCnpj ?? req.body?.cpfCnpj) as unknown;
      if (typeof documento === 'string' && documento) {
        documentoHash = this.auditoriaService.hashDocumento(documento);
      }
    }

    this.auditoriaService
      .registrar({
        tenantId,
        credencial,
        ip: (req.ip || '').slice(0, 64),
        metodo: req.method,
        rota: rota.slice(0, 500),
        recursoTipo: segmentos[0].slice(0, 50),
        recursoId: segmentos.find((s) => UUID_REGEX.test(s)) || null,
        documentoHash,
        httpStatus: res.statusCode,
        sucesso: res.statusCode < 400,
      })
      .catch((err) => this.logger.error(`Falha ao gravar auditoria: ${err.message}`));
  }
}
