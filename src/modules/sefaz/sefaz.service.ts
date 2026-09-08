import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { SefazXmlBuilderService } from './service/sefaz-xml-builder.service';
import { SefazSignerService } from './service/sefaz-signer.service';
import { SefazClientService } from './service/sefaz-client.service';
import { CertificadoService } from '../certificado/certificado.service';
import { EmitenteService } from '../emitente/emitente.service';
import { SefazServicoEnum } from './enum/sefaz-servico.enum';
import { EmitirNfeDto } from '../nota-fiscal/dto/emitir-nfe.dto';

export interface SefazAutorizacaoResult {
  sucesso: boolean;
  cStat: string;
  xMotivo: string;
  protocolo?: string;
  dhAutorizacao?: Date;
  chaveAcesso: string;
  xmlGerado: string;
  xmlAssinado: string;
  xmlProtocolado?: string;
  respostaSefazRaw: any;
}

export interface SefazEventoResult {
  sucesso: boolean;
  cStat: string;
  xMotivo: string;
  nProtEvento?: string;
  dhRegEvento?: Date;
  xmlEventoAssinado: string;
  respostaSefazRaw: any;
}

@Injectable()
export class SefazService {
  private readonly logger = new Logger(SefazService.name);

  constructor(
    private readonly xmlBuilder: SefazXmlBuilderService,
    private readonly signer: SefazSignerService,
    private readonly client: SefazClientService,
    private readonly certificadoService: CertificadoService,
    private readonly emitenteService: EmitenteService,
  ) {}

  private getAmbienteEfetivo(ambienteEmitente?: string): '1' | '2' {
    if (process.env.SEFAZ_FORCE_HOMOLOGACAO === 'true') {
      return '2';
    }
    return (ambienteEmitente || process.env.SEFAZ_DEFAULT_AMBIENTE || '2') as '1' | '2';
  }

  /**
   * Consulta o Status do Serviço da SEFAZ para o Emitente informado
   */
  async consultarStatusServico(emitenteId: string, tenantId: string) {
    const emitente = await this.emitenteService.findByIdAndTenant(emitenteId, tenantId);
    const { certPem, keyPem, pfxBuffer, senha } =
      await this.certificadoService.getCertificadoPem(emitenteId);

    const ambienteEfetivo = this.getAmbienteEfetivo(emitente.ambienteSefaz);
    const cUF = emitente.codigoMunicipioIbge.substring(0, 2);
    const xml = this.xmlBuilder.buildConsStatServXml(cUF, ambienteEfetivo);

    return this.client.sendSoapRequest(
      ambienteEfetivo,
      emitente.uf,
      SefazServicoEnum.STATUS_SERVICO,
      xml,
      pfxBuffer,
      senha,
      certPem,
      keyPem,
    );
  }

  /**
   * Constrói, assina e transmite uma NF-e para a SEFAZ, processando o retorno e montando o nfeProc
   */
  async transmitirNfe(
    chaveAcesso: string,
    numero: number,
    serie: number,
    emitenteId: string,
    tenantId: string,
    dto: EmitirNfeDto,
  ): Promise<SefazAutorizacaoResult> {
    const emitente = await this.emitenteService.findByIdAndTenant(emitenteId, tenantId);
    const { certPem, keyPem, pfxBuffer, senha } =
      await this.certificadoService.getCertificadoPem(emitenteId);
    const ambienteEfetivo = this.getAmbienteEfetivo(emitente.ambienteSefaz);

    // 1. Gera XML não-assinado
    const xmlNfe = this.xmlBuilder.buildNfeXml(
      chaveAcesso,
      numero,
      serie,
      emitente,
      dto,
    );

    // 2. Assina digitalmente o XML com o Certificado A1
    const xmlAssinado = this.signer.signXml(xmlNfe, pfxBuffer, senha);

    // 3. Monta o lote de envio enviNFe (síncrono = true)
    const idLote = String(Date.now()).substring(0, 15);
    const xmlLote = this.xmlBuilder.buildEnviNfeXml(xmlAssinado, idLote, true);

    // 4. Envia via SOAP mTLS para a SEFAZ
    const respostaSefaz = await this.client.sendSoapRequest(
      ambienteEfetivo,
      emitente.uf,
      SefazServicoEnum.AUTORIZACAO,
      xmlLote,
      pfxBuffer,
      senha,
      certPem,
      keyPem,
    );

    // 5. Extrai as informações de retorno da SEFAZ
    const parsedData = respostaSefaz.data;
    const { cStat, xMotivo, protocolo, dhRecbto, digVal, verAplic } =
      this.extrairDadosAutorizacao(parsedData);

    let xmlProtocolado: string | undefined = undefined;
    const sucesso = cStat === '100';

    if (sucesso && protocolo) {
      // Monta o XML protocolado oficial nfeProc
      const xmlSemDeclaration = xmlAssinado.replace(/<\?xml.*?\?>/, '').trim();
      xmlProtocolado = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  ${xmlSemDeclaration}
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${ambienteEfetivo}</tpAmb>
      <verAplic>${verAplic || '1.0'}</verAplic>
      <chNFe>${chaveAcesso}</chNFe>
      <dhRecbto>${dhRecbto || new Date().toISOString()}</dhRecbto>
      <nProt>${protocolo}</nProt>
      <digVal>${digVal || ''}</digVal>
      <cStat>${cStat}</cStat>
      <xMotivo>${xMotivo}</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`.trim();
    }

    return {
      sucesso,
      cStat,
      xMotivo,
      protocolo,
      dhAutorizacao: dhRecbto ? new Date(dhRecbto) : new Date(),
      chaveAcesso,
      xmlGerado: xmlNfe,
      xmlAssinado,
      xmlProtocolado,
      respostaSefazRaw: respostaSefaz,
    };
  }

  /**
   * Transmite um Evento Fiscal para a SEFAZ (Cancelamento ou Carta de Correção)
   */
  async transmitirEvento(
    emitenteId: string,
    tenantId: string,
    chaveAcesso: string,
    tipoEvento: '110111' | '110110',
    sequenciaEvento: number,
    detalheEventoXml: string,
  ): Promise<SefazEventoResult> {
    const emitente = await this.emitenteService.findByIdAndTenant(emitenteId, tenantId);
    const { certPem, keyPem, pfxBuffer, senha } =
      await this.certificadoService.getCertificadoPem(emitenteId);
    const ambienteEfetivo = this.getAmbienteEfetivo(emitente.ambienteSefaz);
    const cUF = emitente.codigoMunicipioIbge.substring(0, 2);

    // 1. Gera XML do Evento
    const xmlEvento = this.xmlBuilder.buildEventoXml(
      cUF,
      ambienteEfetivo,
      emitente.cnpj,
      chaveAcesso,
      tipoEvento,
      sequenciaEvento,
      detalheEventoXml,
    );

    // 2. Assina o Evento
    const xmlEventoAssinado = this.signer.signXml(xmlEvento, pfxBuffer, senha);

    // 3. Monta Envelope de Lote de Evento
    const idLote = String(Date.now()).substring(0, 15);
    const xmlEnvEvento = this.xmlBuilder.buildEnvEventoXml(xmlEventoAssinado, idLote);

    // 4. Envia via WebService RECEPCAO_EVENTO
    const respostaSefaz = await this.client.sendSoapRequest(
      ambienteEfetivo,
      emitente.uf,
      SefazServicoEnum.RECEPCAO_EVENTO,
      xmlEnvEvento,
      pfxBuffer,
      senha,
      certPem,
      keyPem,
    );

    // 5. Processa Retorno
    const parsedData = respostaSefaz.data;
    const { cStat, xMotivo, nProtEvento, dhRegEvento } = this.extrairDadosEvento(parsedData);

    const sucesso = ['135', '136'].includes(cStat);

    return {
      sucesso,
      cStat,
      xMotivo,
      nProtEvento,
      dhRegEvento: dhRegEvento ? new Date(dhRegEvento) : new Date(),
      xmlEventoAssinado,
      respostaSefazRaw: respostaSefaz,
    };
  }

  /**
   * Helper para simular/inspecionar XML assinado sem enviar para a SEFAZ
   */
  async gerarXmlAssinadoPreview(
    chaveAcesso: string,
    numero: number,
    serie: number,
    emitenteId: string,
    tenantId: string,
    dto: EmitirNfeDto,
  ) {
    const emitente = await this.emitenteService.findByIdAndTenant(emitenteId, tenantId);
    const { pfxBuffer, senha } = await this.certificadoService.getCertificadoDecrypted(emitenteId);

    const xmlNfe = this.xmlBuilder.buildNfeXml(chaveAcesso, numero, serie, emitente, dto);
    const xmlAssinado = this.signer.signXml(xmlNfe, pfxBuffer, senha);

    return {
      chaveAcesso,
      xmlNfe,
      xmlAssinado,
    };
  }

  private extrairDadosAutorizacao(data: any): {
    cStat: string;
    xMotivo: string;
    protocolo?: string;
    dhRecbto?: string;
    digVal?: string;
    verAplic?: string;
  } {
    try {
      // Localiza o nó retEnviNFe ou nfeResultMsg
      const envelope = data?.Envelope || data;
      const body = envelope?.Body || envelope;
      const nfeResult =
        body?.nfeAutorizacaoLoteResult ||
        body?.nfeResultMsg ||
        body?.retEnviNFe ||
        body;

      const retEnviNFe = nfeResult?.retEnviNFe || nfeResult;
      const protNFe = retEnviNFe?.protNFe || retEnviNFe;
      const infProt = protNFe?.infProt || protNFe;

      const cStat = String(infProt?.cStat || retEnviNFe?.cStat || '999');
      const xMotivo = String(infProt?.xMotivo || retEnviNFe?.xMotivo || 'Resposta SEFAZ não identificada');
      const protocolo = infProt?.nProt ? String(infProt.nProt) : undefined;
      const dhRecbto = infProt?.dhRecbto ? String(infProt.dhRecbto) : undefined;
      const digVal = infProt?.digVal ? String(infProt.digVal) : undefined;
      const verAplic = infProt?.verAplic ? String(infProt.verAplic) : undefined;

      return { cStat, xMotivo, protocolo, dhRecbto, digVal, verAplic };
    } catch (e) {
      return { cStat: '999', xMotivo: `Erro ao interpretar resposta SEFAZ: ${e.message}` };
    }
  }

  private extrairDadosEvento(data: any): {
    cStat: string;
    xMotivo: string;
    nProtEvento?: string;
    dhRegEvento?: string;
  } {
    try {
      const envelope = data?.Envelope || data;
      const body = envelope?.Body || envelope;
      const resultMsg = body?.nfeRecepcaoEventoResult || body?.nfeResultMsg || body;
      const retEnvEvento = resultMsg?.retEnvEvento || resultMsg;
      const retEvento = retEnvEvento?.retEvento || retEnvEvento;
      const infEvento = retEvento?.infEvento || retEvento;

      const cStat = String(infEvento?.cStat || retEnvEvento?.cStat || '999');
      const xMotivo = String(infEvento?.xMotivo || retEnvEvento?.xMotivo || 'Resposta de evento não identificada');
      const nProtEvento = infEvento?.nProt ? String(infEvento.nProt) : undefined;
      const dhRegEvento = infEvento?.dhRegEvento ? String(infEvento.dhRegEvento) : undefined;

      return { cStat, xMotivo, nProtEvento, dhRegEvento };
    } catch (e) {
      return { cStat: '999', xMotivo: `Erro ao interpretar resposta de evento: ${e.message}` };
    }
  }
}
