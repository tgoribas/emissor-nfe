import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import * as https from 'https';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { SefazServicoEnum } from '../enum/sefaz-servico.enum';
import { getSefazEndpoint } from '../constants/sefaz-endpoints.constant';

@Injectable()
export class SefazClientService {
  private readonly logger = new Logger(SefazClientService.name);
  private readonly parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    removeNSPrefix: true,
  });

  /**
   * Envia uma requisição SOAP 1.2 com mTLS para o WebService da SEFAZ
   */
  async sendSoapRequest(
    ambiente: '1' | '2',
    uf: string,
    servico: SefazServicoEnum,
    corpoXml: string,
    pfxBuffer?: Buffer,
    passphrase?: string,
    certPem?: string,
    keyPem?: string,
  ): Promise<any> {
    const url = getSefazEndpoint(ambiente, uf, servico);
    if (!url) {
      throw new BadRequestException(
        `Endpoint do serviço ${servico} não encontrado para a UF ${uf} no ambiente ${ambiente}`,
      );
    }

    const xmlLimpo = corpoXml
      .replace(/<\?xml.*?\?>/, '')
      .replace(/>\s+</g, '><')
      .trim();

    const soapEnvelope = `<?xml version="1.0" encoding="utf-8"?><soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope"><soap12:Body><nfeDadosMsg xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/${servico}">${xmlLimpo}</nfeDadosMsg></soap12:Body></soap12:Envelope>`.trim();

    // Configuração mTLS (Certificado A1 do Emitente)
    // Usar PEM (cert + key) elimina incompatibilidades de MAC/algoritmos legados do OpenSSL 3
    const agentOptions: https.AgentOptions = {
      rejectUnauthorized: false, // Permite certificados intermediários SEFAZ
      minVersion: 'TLSv1.2',
    };

    if (certPem && keyPem) {
      agentOptions.cert = certPem;
      agentOptions.key = keyPem;
    } else {
      agentOptions.pfx = pfxBuffer;
      agentOptions.passphrase = passphrase;
    }

    const httpsAgent = new https.Agent(agentOptions);

    try {
      this.logger.log(`Enviando requisição SOAP para SEFAZ [${servico}] em ${url}...`);

      const response = await axios.post(url, soapEnvelope, {
        httpsAgent,
        headers: {
          'Content-Type': `application/soap+xml; charset=utf-8; action="http://www.portalfiscal.inf.br/nfe/wsdl/${servico}"`,
        },
        timeout: 30000,
      });

      const parsedData = this.parser.parse(response.data);
      return {
        rawXml: response.data,
        data: parsedData,
      };
    } catch (error) {
      const detalheErro = error.response?.data || error.message;
      this.logger.error(`Erro na comunicação SOAP com SEFAZ: ${detalheErro}`);
      throw new BadRequestException(
        `Falha na comunicação com a SEFAZ (${servico}): ${error.message}`,
      );
    }
  }
}
