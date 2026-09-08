import { SefazServicoEnum } from '../enum/sefaz-servico.enum';

export interface SefazEndpointsConfig {
  [servico: string]: string;
}

// Mapeamento de UFs para seus respectivos servidores da SEFAZ
// SVRS atende: AC, AL, AP, DF, ES, PB, PI, RJ, RN, RO, RR, SC, SE, TO
// SVAN atende: MA, PA
export const SEFAZ_ENDPOINTS: Record<'1' | '2', Record<string, SefazEndpointsConfig>> = {
  // ----------------------------------------------------
  // AMBIENTE 2 = HOMOLOGAÇÃO (TESTES)
  // ----------------------------------------------------
  '2': {
    // SÃO PAULO
    SP: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://homologacao.nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://homologacao.nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
    },
    // RIO GRANDE DO SUL
    RS: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://nfe-homologacao.sefaz.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://nfe-homologacao.sefaz.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://nfe-homologacao.sefaz.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://nfe-homologacao.sefaz.rs.gov.br/ws/NFeRecepcaoEvento/NFeRecepcaoEvento4.asmx',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://nfe-homologacao.sefaz.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://nfe-homologacao.sefaz.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
    },
    // MINAS GERAIS
    MG: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
    },
    // PARANÁ
    PR: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://homologacao.nfe.fazenda.pr.gov.br/nfe/NFeStatusServico4?wsdl',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://homologacao.nfe.fazenda.pr.gov.br/nfe/NFeAutorizacao4?wsdl',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://homologacao.nfe.fazenda.pr.gov.br/nfe/NFeRetAutorizacao4?wsdl',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://homologacao.nfe.fazenda.pr.gov.br/nfe/NFeRecepcaoEvento4?wsdl',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://homologacao.nfe.fazenda.pr.gov.br/nfe/NFeConsultaProtocolo4?wsdl',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://homologacao.nfe.fazenda.pr.gov.br/nfe/NFeInutilizacao4?wsdl',
    },
    // SVRS (SEFAZ VIRTUAL RS) - RJ, SC, ES, DF, PB, RN, PI, CE, SE, AL, TO, RO, AC, AP, RR
    SVRS: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://nfe-homologacao.svrs.rs.gov.br/ws/NFeRecepcaoEvento/NFeRecepcaoEvento4.asmx',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://nfe-homologacao.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://nfe-homologacao.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
    },
  },

  // ----------------------------------------------------
  // AMBIENTE 1 = PRODUÇÃO
  // ----------------------------------------------------
  '1': {
    SP: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://nfe.fazenda.sp.gov.br/ws/nfestatusservico4.asmx',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://nfe.fazenda.sp.gov.br/ws/nfeautorizacao4.asmx',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://nfe.fazenda.sp.gov.br/ws/nferetautorizacao4.asmx',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://nfe.fazenda.sp.gov.br/ws/nferecepcaoevento4.asmx',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://nfe.fazenda.sp.gov.br/ws/nfeconsultaprotocolo4.asmx',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://nfe.fazenda.sp.gov.br/ws/nfeinutilizacao4.asmx',
    },
    RS: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://nfe.sefaz.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://nfe.sefaz.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://nfe.sefaz.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://nfe.sefaz.rs.gov.br/ws/NFeRecepcaoEvento/NFeRecepcaoEvento4.asmx',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://nfe.sefaz.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://nfe.sefaz.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
    },
    MG: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
    },
    PR: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://nfe.fazenda.pr.gov.br/nfe/NFeStatusServico4?wsdl',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://nfe.fazenda.pr.gov.br/nfe/NFeAutorizacao4?wsdl',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://nfe.fazenda.pr.gov.br/nfe/NFeRetAutorizacao4?wsdl',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://nfe.fazenda.pr.gov.br/nfe/NFeRecepcaoEvento4?wsdl',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://nfe.fazenda.pr.gov.br/nfe/NFeConsultaProtocolo4?wsdl',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://nfe.fazenda.pr.gov.br/nfe/NFeInutilizacao4?wsdl',
    },
    SVRS: {
      [SefazServicoEnum.STATUS_SERVICO]:
        'https://nfe.svrs.rs.gov.br/ws/NfeStatusServico/NfeStatusServico4.asmx',
      [SefazServicoEnum.AUTORIZACAO]:
        'https://nfe.svrs.rs.gov.br/ws/NfeAutorizacao/NFeAutorizacao4.asmx',
      [SefazServicoEnum.RET_AUTORIZACAO]:
        'https://nfe.svrs.rs.gov.br/ws/NfeRetAutorizacao/NFeRetAutorizacao4.asmx',
      [SefazServicoEnum.RECEPCAO_EVENTO]:
        'https://nfe.svrs.rs.gov.br/ws/NFeRecepcaoEvento/NFeRecepcaoEvento4.asmx',
      [SefazServicoEnum.CONSULTA_PROTOCOLO]:
        'https://nfe.svrs.rs.gov.br/ws/NfeConsulta/NfeConsulta4.asmx',
      [SefazServicoEnum.INUTILIZACAO]:
        'https://nfe.svrs.rs.gov.br/ws/nfeinutilizacao/nfeinutilizacao4.asmx',
    },
  },
};

/**
 * Retorna a URL do WebService da SEFAZ para a UF e Serviço informados
 */
export function getSefazEndpoint(
  ambiente: '1' | '2',
  uf: string,
  servico: SefazServicoEnum,
): string {
  const ufNormalizada = uf.toUpperCase();
  const ambienteEndpoints = SEFAZ_ENDPOINTS[ambiente] || SEFAZ_ENDPOINTS['2'];

  const config = ambienteEndpoints[ufNormalizada] || ambienteEndpoints['SVRS'];
  return config[servico];
}
