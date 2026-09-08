import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { NotaFiscalEntity } from './entity/nota-fiscal.entity';
import { EmitirNfeDto } from './dto/emitir-nfe.dto';
import { StatusNfeEnum } from './enum/status-nfe.enum';
import { TipoEmissaoNfeEnum } from './enum/tipo-emissao-nfe.enum';
import { SerieNumeracaoService } from '../serie-numeracao/serie-numeracao.service';
import { TipoDocumentoFiscalEnum } from '../serie-numeracao/enum/tipo-documento-fiscal.enum';
import { EmitenteService } from '../emitente/emitente.service';
import { SefazXmlBuilderService } from '../sefaz/service/sefaz-xml-builder.service';
import { SefazService } from '../sefaz/sefaz.service';
import { DanfeService } from './service/danfe.service';
import { WebhookService } from '../webhook/webhook.service';
import { WebhookEventoEnum } from '../webhook/enum/webhook-evento.enum';
import { TenantService } from '../tenant/tenant.service';
import { EventoFiscalEntity } from '../evento-fiscal/entity/evento-fiscal.entity';
import { TipoEventoFiscalEnum } from '../evento-fiscal/enum/tipo-evento-fiscal.enum';

@Injectable()
export class NotaFiscalService {
  private readonly logger = new Logger(NotaFiscalService.name);

  constructor(
    @InjectRepository(NotaFiscalEntity)
    private readonly notaFiscalRepository: Repository<NotaFiscalEntity>,
    @InjectRepository(EventoFiscalEntity)
    private readonly eventoRepository: Repository<EventoFiscalEntity>,
    private readonly serieService: SerieNumeracaoService,
    private readonly emitenteService: EmitenteService,
    private readonly xmlBuilder: SefazXmlBuilderService,
    private readonly sefazService: SefazService,
    private readonly danfeService: DanfeService,
    private readonly webhookService: WebhookService,
    private readonly tenantService: TenantService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Gera o dígito verificador da Chave de Acesso (Módulo 11 SEFAZ)
   */
  private calcularDigitoVerificadorChave(chave43: string): number {
    let soma = 0;
    let peso = 2;
    for (let i = chave43.length - 1; i >= 0; i--) {
      soma += parseInt(chave43[i], 10) * peso;
      peso = peso === 9 ? 2 : peso + 1;
    }
    const resto = soma % 11;
    return resto === 0 || resto === 1 ? 0 : 11 - resto;
  }

  /**
   * Monta a chave de acesso de 44 dígitos padrão SEFAZ
   */
  public gerarChaveAcesso(
    codigoUf: string,
    dataEmissao: Date,
    cnpj: string,
    modelo: string,
    serie: number,
    numero: number,
    tipoEmissao: string,
    codigoNumerico: string,
  ): string {
    const aa = dataEmissao.getFullYear().toString().substring(2);
    const mm = String(dataEmissao.getMonth() + 1).padStart(2, '0');
    const cnpjLimpo = cnpj.replace(/\D/g, '').padStart(14, '0');
    const mod = modelo.padStart(2, '0');
    const ser = String(serie).padStart(3, '0');
    const num = String(numero).padStart(9, '0');
    const tpEmis = tipoEmissao;
    const cNF = codigoNumerico.padStart(8, '0');

    const chave43 = `${codigoUf}${aa}${mm}${cnpjLimpo}${mod}${ser}${num}${tpEmis}${cNF}`;
    const cDV = this.calcularDigitoVerificadorChave(chave43);
    return `${chave43}${cDV}`;
  }

  /**
   * Emite a NF-e: reserva número, gera chave, constrói XML, assina e transmite à SEFAZ
   */
  async emitir(tenantId: string, dto: EmitirNfeDto): Promise<NotaFiscalEntity> {
    const emitente = await this.emitenteService.findByIdAndTenant(dto.emitenteId, tenantId);
    const tenant = await this.tenantService.findById(tenantId);

    const serie = dto.serie || 1;
    const tipoEmissao = dto.tipoEmissao || TipoEmissaoNfeEnum.NORMAL;
    const codigoUf = emitente.codigoMunicipioIbge.substring(0, 2);
    const dataEmissao = dto.dataEmissao ? new Date(dto.dataEmissao) : new Date();
    const codigoNumerico = Math.floor(10000000 + Math.random() * 90000000).toString();

    // 1. Reserva atômica do número da nota
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let notaSalva: NotaFiscalEntity;
    let numero: number;
    let chaveAcesso: string;

    try {
      numero =
        dto.numero ||
        (await this.serieService.getNextNumberAndIncrement(
          emitente.id,
          serie,
          TipoDocumentoFiscalEnum.NFE,
          queryRunner.manager,
        ));

      chaveAcesso = this.gerarChaveAcesso(
        codigoUf,
        dataEmissao,
        emitente.cnpj,
        '55',
        serie,
        numero,
        tipoEmissao,
        codigoNumerico,
      );

      const novaNota = queryRunner.manager.create(NotaFiscalEntity, {
        tenantId,
        emitenteId: emitente.id,
        referenciaExterna: dto.referenciaExterna,
        modeloDocumento: '55',
        serie,
        numero,
        chaveAcesso,
        status: StatusNfeEnum.PROCESSANDO,
        tipoEmissao,
        payloadOriginal: dto,
      });

      notaSalva = await queryRunner.manager.save(novaNota);
      await queryRunner.commitTransaction();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw new BadRequestException(`Erro ao reservar numeração de nota: ${error.message}`);
    } finally {
      await queryRunner.release();
    }

    // 2. Transmissão para a SEFAZ
    try {
      const retornoSefaz = await this.sefazService.transmitirNfe(
        chaveAcesso,
        numero,
        serie,
        emitente.id,
        tenantId,
        dto,
      );

      notaSalva.xmlGerado = retornoSefaz.xmlGerado;
      notaSalva.xmlAssinado = retornoSefaz.xmlAssinado;
      notaSalva.cStat = retornoSefaz.cStat;
      notaSalva.xMotivo = retornoSefaz.xMotivo;

      if (retornoSefaz.sucesso) {
        notaSalva.status = StatusNfeEnum.AUTORIZADA;
        notaSalva.protocoloAutorizacao = retornoSefaz.protocolo;
        notaSalva.dhAutorizacao = retornoSefaz.dhAutorizacao;
        notaSalva.xmlProtocolado = retornoSefaz.xmlProtocolado;
      } else if (retornoSefaz.cStat === '110') {
        notaSalva.status = StatusNfeEnum.DENEGADA;
      } else {
        notaSalva.status = StatusNfeEnum.REJEITADA;
      }

      await this.notaFiscalRepository.save(notaSalva);

      // 3. Disparo de Webhook (se configurado)
      if (tenant?.webhookUrl) {
        const eventoTipo = retornoSefaz.sucesso
          ? WebhookEventoEnum.NFE_AUTORIZADA
          : WebhookEventoEnum.NFE_REJEITADA;

        this.webhookService
          .disparar(
            tenantId,
            tenant.webhookUrl,
            eventoTipo,
            {
              id: notaSalva.id,
              referenciaExterna: notaSalva.referenciaExterna,
              chaveAcesso: notaSalva.chaveAcesso,
              numero: notaSalva.numero,
              serie: notaSalva.serie,
              status: notaSalva.status,
              cStat: notaSalva.cStat,
              xMotivo: notaSalva.xMotivo,
              protocolo: notaSalva.protocoloAutorizacao,
              dhAutorizacao: notaSalva.dhAutorizacao,
            },
            notaSalva.id,
          )
          .catch((err) => this.logger.error(`Erro ao disparar webhook: ${err.message}`));
      }

      return notaSalva;
    } catch (error) {
      notaSalva.status = StatusNfeEnum.REJEITADA;
      notaSalva.xMotivo = error.message;
      await this.notaFiscalRepository.save(notaSalva);
      throw new BadRequestException(`Erro na transmissão para a SEFAZ: ${error.message}`);
    }
  }

  /**
   * Gera o Buffer PDF de Pré-visualização do DANFE
   */
  async gerarPreviewDanfe(tenantId: string, dto: EmitirNfeDto): Promise<Buffer> {
    const emitente = await this.emitenteService.findByIdAndTenant(dto.emitenteId, tenantId);
    const numero = dto.numero || 1;
    const serie = dto.serie || 1;
    const codigoUf = emitente.codigoMunicipioIbge.substring(0, 2);
    const chaveAcesso = this.gerarChaveAcesso(
      codigoUf,
      new Date(),
      emitente.cnpj,
      '55',
      serie,
      numero,
      '1',
      '12345678',
    );

    const xml = this.xmlBuilder.buildNfeXml(chaveAcesso, numero, serie, emitente, dto);
    return this.danfeService.gerarDanfePdf(xml);
  }

  /**
   * Obtém o Buffer PDF do DANFE de uma nota existente
   */
  async obterDanfePdf(idOuChave: string, tenantId: string): Promise<Buffer> {
    const nota = await this.buscarPorIdOuChave(idOuChave, tenantId);
    const xml = nota.xmlProtocolado || nota.xmlAssinado || nota.xmlGerado;

    if (!xml) {
      throw new NotFoundException('XML da nota fiscal não disponível para gerar DANFE');
    }

    return this.danfeService.gerarDanfePdf(xml);
  }

  /**
   * Obtém o XML da nota fiscal (protocolado se disponível, senão assinado/gerado)
   */
  async obterXml(idOuChave: string, tenantId: string): Promise<string> {
    const nota = await this.buscarPorIdOuChave(idOuChave, tenantId);
    const xml = nota.xmlProtocolado || nota.xmlAssinado || nota.xmlGerado;

    if (!xml) {
      throw new NotFoundException('XML da nota fiscal não encontrado');
    }

    return xml;
  }

  /**
   * Cancela uma NF-e autorizada na SEFAZ
   */
  async cancelar(
    idOuChave: string,
    tenantId: string,
    justificativa: string,
  ): Promise<NotaFiscalEntity> {
    const nota = await this.buscarPorIdOuChave(idOuChave, tenantId);
    const tenant = await this.tenantService.findById(tenantId);

    if (nota.status !== StatusNfeEnum.AUTORIZADA) {
      throw new BadRequestException(
        `Apenas notas com status AUTORIZADA podem ser canceladas. Status atual: ${nota.status}`,
      );
    }

    if (!justificativa || justificativa.length < 15 || justificativa.length > 255) {
      throw new BadRequestException('A justificativa de cancelamento deve ter entre 15 e 255 caracteres');
    }

    const detalheXml = `<descEvento>Cancelamento</descEvento><nProt>${nota.protocoloAutorizacao}</nProt><xJust>${this.escapeXml(justificativa)}</xJust>`;

    const resultadoEvento = await this.sefazService.transmitirEvento(
      nota.emitenteId,
      tenantId,
      nota.chaveAcesso,
      '110111',
      1,
      detalheXml,
    );

    if (!resultadoEvento.sucesso) {
      throw new BadRequestException(
        `SEFAZ rejeitou o cancelamento (#${resultadoEvento.cStat}): ${resultadoEvento.xMotivo}`,
      );
    }

    // Salva evento fiscal
    const evento = this.eventoRepository.create({
      notaFiscalId: nota.id,
      tipoEvento: TipoEventoFiscalEnum.CANCELAMENTO,
      sequenciaEvento: 1,
      descricao: justificativa,
      protocoloEvento: resultadoEvento.nProtEvento,
      cStat: resultadoEvento.cStat,
      xMotivo: resultadoEvento.xMotivo,
      xmlEvento: resultadoEvento.xmlEventoAssinado,
    });
    await this.eventoRepository.save(evento);

    // Atualiza status da nota
    nota.status = StatusNfeEnum.CANCELADA;
    const notaAtualizada = await this.notaFiscalRepository.save(nota);

    // Dispara webhook
    if (tenant?.webhookUrl) {
      this.webhookService
        .disparar(
          tenantId,
          tenant.webhookUrl,
          WebhookEventoEnum.NFE_CANCELADA,
          {
            id: nota.id,
            referenciaExterna: nota.referenciaExterna,
            chaveAcesso: nota.chaveAcesso,
            status: nota.status,
            protocoloCancelamento: resultadoEvento.nProtEvento,
            justificativa,
          },
          nota.id,
        )
        .catch((err) => this.logger.error(`Erro webhook cancelamento: ${err.message}`));
    }

    return notaAtualizada;
  }

  /**
   * Envia uma Carta de Correção Eletrônica (CC-e) para a SEFAZ
   */
  async cartaCorrecao(
    idOuChave: string,
    tenantId: string,
    correcao: string,
  ): Promise<EventoFiscalEntity> {
    const nota = await this.buscarPorIdOuChave(idOuChave, tenantId);
    const tenant = await this.tenantService.findById(tenantId);

    if (nota.status !== StatusNfeEnum.AUTORIZADA) {
      throw new BadRequestException(
        `Carta de Correção só pode ser emitida para notas AUTORIZADAS. Status atual: ${nota.status}`,
      );
    }

    if (!correcao || correcao.length < 15 || correcao.length > 1000) {
      throw new BadRequestException('A correção deve ter entre 15 e 1000 caracteres');
    }

    // Identifica próxima sequência
    const eventos = await this.eventoRepository.find({
      where: { notaFiscalId: nota.id, tipoEvento: TipoEventoFiscalEnum.CARTA_CORRECAO },
    });
    const sequencia = eventos.length + 1;

    const xCondUso =
      'A Carta de Correcao e disciplinada pelo paragrafo 1o-A do art. 7o do Convenio S/N, de 15 de dezembro de 1970 e pode ser utilizada para regularizacao de erro ocorrido na emissao de documento fiscal, desde que o erro nao esteja relacionado com: I - as variaveis que determinam o valor do imposto tais como: base de calculo, aliquota, diferenca de preco, quantidade, valor da operacao ou da prestacao; II - a correcao de dados cadastrais que implique mudanca do remetente ou do destinatario; III - a data de emissao ou de saida.';

    const detalheXml = `<descEvento>Carta de Correcao</descEvento><xCorrecao>${this.escapeXml(correcao)}</xCorrecao><xCondUso>${xCondUso}</xCondUso>`;

    const resultadoEvento = await this.sefazService.transmitirEvento(
      nota.emitenteId,
      tenantId,
      nota.chaveAcesso,
      '110110',
      sequencia,
      detalheXml,
    );

    if (!resultadoEvento.sucesso) {
      throw new BadRequestException(
        `SEFAZ rejeitou a Carta de Correção (#${resultadoEvento.cStat}): ${resultadoEvento.xMotivo}`,
      );
    }

    const evento = this.eventoRepository.create({
      notaFiscalId: nota.id,
      tipoEvento: TipoEventoFiscalEnum.CARTA_CORRECAO,
      sequenciaEvento: sequencia,
      descricao: correcao,
      protocoloEvento: resultadoEvento.nProtEvento,
      cStat: resultadoEvento.cStat,
      xMotivo: resultadoEvento.xMotivo,
      xmlEvento: resultadoEvento.xmlEventoAssinado,
    });

    const eventoSalvo = await this.eventoRepository.save(evento);

    if (tenant?.webhookUrl) {
      this.webhookService
        .disparar(
          tenantId,
          tenant.webhookUrl,
          WebhookEventoEnum.EVENTO_REGISTRADO,
          {
            id: nota.id,
            chaveAcesso: nota.chaveAcesso,
            tipoEvento: 'CARTA_CORRECAO',
            sequenciaEvento: sequencia,
            protocoloEvento: resultadoEvento.nProtEvento,
            correcao,
          },
          nota.id,
        )
        .catch((err) => this.logger.error(`Erro webhook CC-e: ${err.message}`));
    }

    return eventoSalvo as EventoFiscalEntity;
  }

  async findById(id: string, tenantId: string): Promise<NotaFiscalEntity> {
    const nota = await this.notaFiscalRepository.findOne({
      where: { id, tenantId },
      relations: ['emitente', 'eventos'],
    });

    if (!nota) {
      throw new NotFoundException('Nota fiscal não encontrada');
    }

    return nota;
  }

  async findByChaveAcesso(chaveAcesso: string, tenantId: string): Promise<NotaFiscalEntity> {
    const nota = await this.notaFiscalRepository.findOne({
      where: { chaveAcesso, tenantId },
      relations: ['emitente', 'eventos'],
    });

    if (!nota) {
      throw new NotFoundException('Nota fiscal não encontrada para esta chave');
    }

    return nota;
  }

  async findByReferencia(referenciaExterna: string, tenantId: string): Promise<NotaFiscalEntity> {
    const nota = await this.notaFiscalRepository.findOne({
      where: { referenciaExterna, tenantId },
      relations: ['emitente', 'eventos'],
    });

    if (!nota) {
      throw new NotFoundException('Nota fiscal não encontrada para esta referência');
    }

    return nota;
  }

  private async buscarPorIdOuChave(idOuChave: string, tenantId: string): Promise<NotaFiscalEntity> {
    if (idOuChave.length === 44 && /^\d+$/.test(idOuChave)) {
      return this.findByChaveAcesso(idOuChave, tenantId);
    }
    if (idOuChave.startsWith('polutec_nfe_') || idOuChave.startsWith('ref_')) {
      return this.findByReferencia(idOuChave, tenantId);
    }
    return this.findById(idOuChave, tenantId);
  }

  async findAllByTenant(tenantId: string): Promise<NotaFiscalEntity[]> {
    return this.notaFiscalRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
      take: 100,
    });
  }

  private escapeXml(text: string): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
