import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { gerarPDF } from 'nfe-danfe-pdf';

@Injectable()
export class DanfeService {
  private readonly logger = new Logger(DanfeService.name);

  /**
   * Converte o ReadableStream do PDFDocument em um Buffer binário
   */
  private streamToBuffer(doc: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err: any) => reject(err));
    });
  }

  /**
   * Gera o Buffer PDF do DANFE a partir do XML da NF-e (protocolado ou assinado)
   */
  async gerarDanfePdf(xmlNfeOuProc: string): Promise<Buffer> {
    try {
      let xmlParaGerar = xmlNfeOuProc.trim();

      // Se for um XML sem o envelope <nfeProc>, encapsulamos para gerar o preview
      if (!xmlParaGerar.includes('<nfeProc')) {
        // Extrai a chave de acesso da tag infNFe Id="NFe..."
        const chaveMatch = xmlParaGerar.match(/infNFe\s+Id="NFe(\d{44})"/);
        const chaveAcesso = chaveMatch ? chaveMatch[1] : '00000000000000000000000000000000000000000000';
        const dataHora = new Date().toISOString().replace(/\.\d{3}Z$/, '-03:00');

        xmlParaGerar = `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  ${xmlParaGerar.replace(/<\?xml.*?\?>/, '')}
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>2</tpAmb>
      <verAplic>1.0.0</verAplic>
      <chNFe>${chaveAcesso}</chNFe>
      <dhRecbto>${dataHora}</dhRecbto>
      <nProt>000000000000000</nProt>
      <digVal>PREVIEW=</digVal>
      <cStat>100</cStat>
      <xMotivo>PREVIEW DANFE - SEM VALOR FISCAL</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`.trim();
      }

      const doc = await gerarPDF(xmlParaGerar);
      return await this.streamToBuffer(doc);
    } catch (error) {
      this.logger.error(`Erro ao gerar PDF do DANFE: ${error.message}`);
      throw new BadRequestException(`Falha na renderização do DANFE PDF: ${error.message}`);
    }
  }
}
