import { Injectable } from '@nestjs/common';
import { EmitirNfeDto, ItemNfeDto } from '../../nota-fiscal/dto/emitir-nfe.dto';
import { EmitenteEntity } from '../../emitente/entity/emitente.entity';
import { AmbienteSefazEnum } from '../../emitente/enum/ambiente-sefaz.enum';

@Injectable()
export class SefazXmlBuilderService {
  /**
   * Constrói o XML da NF-e no padrão SEFAZ Layout 4.00
   */
  buildNfeXml(
    chaveAcesso: string,
    numero: number,
    serie: number,
    emitente: EmitenteEntity,
    dto: EmitirNfeDto,
  ): string {
    const isForcedHomologacao = process.env.SEFAZ_FORCE_HOMOLOGACAO === 'true';
    const tpAmb = isForcedHomologacao
      ? AmbienteSefazEnum.HOMOLOGACAO
      : emitente.ambienteSefaz ||
        (process.env.SEFAZ_DEFAULT_AMBIENTE as AmbienteSefazEnum) ||
        AmbienteSefazEnum.HOMOLOGACAO;

    const cUF = emitente.codigoMunicipioIbge.substring(0, 2);
    const cNF = chaveAcesso.substring(35, 43);
    const cDV = chaveAcesso.substring(43, 44);

    const dataEmissao = dto.dataEmissao
      ? new Date(dto.dataEmissao).toISOString().replace(/\.\d{3}Z$/, '-03:00')
      : new Date().toISOString().replace(/\.\d{3}Z$/, '-03:00');

    const dataSaidaEntrada = dto.dataSaidaEntrada
      ? new Date(dto.dataSaidaEntrada).toISOString().replace(/\.\d{3}Z$/, '-03:00')
      : dataEmissao;

    const tpNF = dto.tipoDocumento || '1';
    const finNFe = dto.finalidadeEmissao || '1';
    const indPres = dto.presencaComprador || '1';
    const indFinal = dto.consumidorFinal || '1';

    // Regra Destino: 1 = Interna (mesma UF), 2 = Interestadual, 3 = Exterior
    const idDest =
      dto.destinatario.uf === emitente.uf
        ? '1'
        : dto.destinatario.uf === 'EX'
          ? '3'
          : '2';

    // Regra Nome Destinatário em Homologação
    const xNomeDest =
      tpAmb === AmbienteSefazEnum.HOMOLOGACAO
        ? 'NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL'
        : dto.destinatario.nome;

    // Acumuladores de totais
    let totVProd = 0;
    let totVBC = 0;
    let totVICMS = 0;
    let totVPIS = 0;
    let totVCOFINS = 0;
    let totVIPI = 0;
    let totVFCPUFDest = 0;
    let totVICMSUFDest = 0;
    let totVICMSUFRemet = 0;

    const itensXml = dto.itens
      .map((item, index) => {
        const nItem = item.numeroItem || index + 1;
        const vProd =
          item.valorTotalBruto !== undefined
            ? Number(item.valorTotalBruto)
            : Number(item.quantidadeComercial) * Number(item.valorUnitario);

        totVProd += vProd;

        // Impostos do Item
        const impostoXml = this.buildImpostoItemXml(item, emitente.regimeTributario);

        if (item.icmsBaseCalculo) totVBC += Number(item.icmsBaseCalculo);
        if (item.icmsValorTotal) totVICMS += Number(item.icmsValorTotal);
        if (item.pisValor) totVPIS += Number(item.pisValor);
        if (item.cofinsValor) totVCOFINS += Number(item.cofinsValor);
        if (item.ipiValor) totVIPI += Number(item.ipiValor);
        if (item.fcpValorUfDestino) totVFCPUFDest += Number(item.fcpValorUfDestino);
        if (item.icmsValorUfDestino) totVICMSUFDest += Number(item.icmsValorUfDestino);
        if (item.icmsValorUfRemetente) totVICMSUFRemet += Number(item.icmsValorUfRemetente);

        const cEAN = item.codigoBarras || 'SEM GTIN';
        const ncmLimpo = item.ncm.replace(/\D/g, '');
        const cfopLimpo = item.cfop.replace(/\D/g, '');
        const cBenefTag = item.codigoBeneficioFiscal
          ? `<cBenef>${this.escapeXml(item.codigoBeneficioFiscal)}</cBenef>`
          : '';

        const pedidoTag =
          item.pedidoCompra || item.numeroItemPedidoCompra
            ? `${item.pedidoCompra ? `<xPed>${this.escapeXml(item.pedidoCompra)}</xPed>` : ''}${item.numeroItemPedidoCompra ? `<nItemPed>${this.escapeXml(item.numeroItemPedidoCompra)}</nItemPed>` : ''}`
            : '';

        return `
      <det nItem="${nItem}">
        <prod>
          <cProd>${this.escapeXml(item.codigo)}</cProd>
          <cEAN>${cEAN}</cEAN>
          <xProd>${this.escapeXml(item.descricao)}</xProd>
          <NCM>${ncmLimpo}</NCM>
          ${cBenefTag}
          <CFOP>${cfopLimpo}</CFOP>
          <uCom>${this.escapeXml(item.unidadeComercial)}</uCom>
          <qCom>${Number(item.quantidadeComercial).toFixed(4)}</qCom>
          <vUnCom>${Number(item.valorUnitario).toFixed(4)}</vUnCom>
          <vProd>${vProd.toFixed(2)}</vProd>
          <cEANTrib>${cEAN}</cEANTrib>
          <uTrib>${this.escapeXml(item.unidadeComercial)}</uTrib>
          <qTrib>${Number(item.quantidadeComercial).toFixed(4)}</qTrib>
          <vUnTrib>${Number(item.valorUnitario).toFixed(4)}</vUnTrib>
          <indTot>1</indTot>
          ${pedidoTag}
        </prod>
        ${impostoXml}
      </det>`;
      })
      .join('');

    // Destinatário
    const destCpfCnpj = dto.destinatario.cpfCnpj.replace(/\D/g, '');
    const tagCpfCnpjDest =
      destCpfCnpj.length === 11
        ? `<CPF>${destCpfCnpj}</CPF>`
        : `<CNPJ>${destCpfCnpj}</CNPJ>`;

    const indIEDest = dto.destinatario.indicadorIeDest || (dto.destinatario.inscricaoEstadual ? '1' : '9');
    let ieDestTag = `<indIEDest>${indIEDest}</indIEDest>`;
    if (indIEDest === '1' && dto.destinatario.inscricaoEstadual) {
      ieDestTag += `<IE>${dto.destinatario.inscricaoEstadual.replace(/\D/g, '')}</IE>`;
    }

    const emailDestTag = dto.destinatario.email
      ? `<email>${this.escapeXml(dto.destinatario.email)}</email>`
      : '';

    const foneDestTag = dto.destinatario.telefone
      ? `<fone>${dto.destinatario.telefone.replace(/\D/g, '')}</fone>`
      : '';

    // Totais
    const vFrete = dto.valorFrete ? Number(dto.valorFrete) : 0;
    const vSeg = dto.valorSeguro ? Number(dto.valorSeguro) : 0;
    const vDesc = dto.valorDesconto ? Number(dto.valorDesconto) : 0;
    const vOutro = dto.valorOutrasDespesas ? Number(dto.valorOutrasDespesas) : 0;
    const vNFCalculado = totVProd + vFrete + vSeg + totVIPI + vOutro - vDesc;
    const vNF = dto.valorTotalNfe !== undefined ? Number(dto.valorTotalNfe) : vNFCalculado;

    // Transporte
    const transporteXml = this.buildTransporteXml(dto.transporte);

    // Cobrança (Fatura + Duplicatas)
    const cobrancaXml = this.buildCobrancaXml(dto.cobranca, vNF, vDesc);

    // Pagamento
    const pagamentoXml = this.buildPagamentoXml(dto.pagamentos, vNF);

    const infCpl = dto.informacoesComplementares
      ? `<infCpl>${this.escapeXml(dto.informacoesComplementares)}</infCpl>`
      : '';
    const infAdFisco = dto.informacoesAdicionaisFisco
      ? `<infAdFisco>${this.escapeXml(dto.informacoesAdicionaisFisco)}</infAdFisco>`
      : '';
    const infAdicXml =
      infCpl || infAdFisco ? `<infAdic>${infAdFisco}${infCpl}</infAdic>` : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<NFe xmlns="http://www.portalfiscal.inf.br/nfe">
  <infNFe Id="NFe${chaveAcesso}" versao="4.00">
    <ide>
      <cUF>${cUF}</cUF>
      <cNF>${cNF}</cNF>
      <natOp>${this.escapeXml(dto.naturezaOperacao)}</natOp>
      <mod>55</mod>
      <serie>${serie}</serie>
      <nNF>${numero}</nNF>
      <dhEmi>${dataEmissao}</dhEmi>
      <dhSaiEnt>${dataSaidaEntrada}</dhSaiEnt>
      <tpNF>${tpNF}</tpNF>
      <idDest>${idDest}</idDest>
      <cMunFG>${emitente.codigoMunicipioIbge}</cMunFG>
      <tpImp>1</tpImp>
      <tpEmis>1</tpEmis>
      <cDV>${cDV}</cDV>
      <tpAmb>${tpAmb}</tpAmb>
      <finNFe>${finNFe}</finNFe>
      <indFinal>${indFinal}</indFinal>
      <indPres>${indPres}</indPres>
      <procEmi>0</procEmi>
      <verProc>1.0.0</verProc>
    </ide>
    <emit>
      <CNPJ>${emitente.cnpj.replace(/\D/g, '')}</CNPJ>
      <xNome>${this.escapeXml(emitente.razaoSocial)}</xNome>
      ${emitente.nomeFantasia ? `<xFant>${this.escapeXml(emitente.nomeFantasia)}</xFant>` : ''}
      <enderEmit>
        <xLgr>${this.escapeXml(emitente.logradouro || 'Rua Principal')}</xLgr>
        <nro>${this.escapeXml(emitente.numero || 'S/N')}</nro>
        <xBairro>${this.escapeXml(emitente.bairro || 'Centro')}</xBairro>
        <cMun>${emitente.codigoMunicipioIbge}</cMun>
        <xMun>${this.escapeXml(emitente.uf)}</xMun>
        <UF>${emitente.uf}</UF>
        <CEP>${(emitente.cep || '01001000').replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
      </enderEmit>
      <IE>${emitente.inscricaoEstadual.replace(/\D/g, '')}</IE>
      <CRT>${emitente.regimeTributario || '3'}</CRT>
    </emit>
    <dest>
      ${tagCpfCnpjDest}
      <xNome>${this.escapeXml(xNomeDest)}</xNome>
      <enderDest>
        <xLgr>${this.escapeXml(dto.destinatario.logradouro)}</xLgr>
        <nro>${this.escapeXml(dto.destinatario.numero)}</nro>
        ${dto.destinatario.complemento ? `<xCpl>${this.escapeXml(dto.destinatario.complemento)}</xCpl>` : ''}
        <xBairro>${this.escapeXml(dto.destinatario.bairro)}</xBairro>
        <cMun>${dto.destinatario.codigoMunicipioIbge}</cMun>
        <xMun>${this.escapeXml(dto.destinatario.municipio || dto.destinatario.uf)}</xMun>
        <UF>${dto.destinatario.uf}</UF>
        <CEP>${dto.destinatario.cep.replace(/\D/g, '')}</CEP>
        <cPais>1058</cPais>
        <xPais>Brasil</xPais>
        ${foneDestTag}
      </enderDest>
      ${ieDestTag}
      ${emailDestTag}
    </dest>
    ${itensXml}
    <total>
      <ICMSTot>
        <vBC>${totVBC.toFixed(2)}</vBC>
        <vICMS>${totVICMS.toFixed(2)}</vICMS>
        <vICMSDeson>0.00</vICMSDeson>
        <vFCPUFDest>${totVFCPUFDest.toFixed(2)}</vFCPUFDest>
        <vICMSUFDest>${totVICMSUFDest.toFixed(2)}</vICMSUFDest>
        <vICMSUFRemet>${totVICMSUFRemet.toFixed(2)}</vICMSUFRemet>
        <vFCP>0.00</vFCP>
        <vBCST>0.00</vBCST>
        <vST>0.00</vST>
        <vFCPST>0.00</vFCPST>
        <vFCPSTRet>0.00</vFCPSTRet>
        <vProd>${totVProd.toFixed(2)}</vProd>
        <vFrete>${vFrete.toFixed(2)}</vFrete>
        <vSeg>${vSeg.toFixed(2)}</vSeg>
        <vDesc>${vDesc.toFixed(2)}</vDesc>
        <vII>0.00</vII>
        <vIPI>${totVIPI.toFixed(2)}</vIPI>
        <vIPIDevol>0.00</vIPIDevol>
        <vPIS>${totVPIS.toFixed(2)}</vPIS>
        <vCOFINS>${totVCOFINS.toFixed(2)}</vCOFINS>
        <vOutro>${vOutro.toFixed(2)}</vOutro>
        <vNF>${vNF.toFixed(2)}</vNF>
      </ICMSTot>
    </total>
    ${transporteXml}
    ${cobrancaXml}
    ${pagamentoXml}
    ${infAdicXml}
  </infNFe>
</NFe>`.trim();
  }

  private buildImpostoItemXml(item: ItemNfeDto, regimeTributario?: string): string {
    const orig = item.origem || '0';
    let icmsXml = '';

    const isSimples = regimeTributario === '1' || regimeTributario === '2';

    if (isSimples) {
      const csosn = item.icmsCst || '102';
      icmsXml = `<ICMS><ICMSSN${csosn}><orig>${orig}</orig><CSOSN>${csosn}</CSOSN></ICMSSN${csosn}></ICMS>`;
    } else {
      const cst = item.icmsCst || '00';
      const modBC = item.icmsModBc || '3';
      const vBC = Number(item.icmsBaseCalculo || 0).toFixed(2);
      const pICMS = Number(item.icmsAliquota || 0).toFixed(2);
      const vICMS = Number(item.icmsValorTotal || 0).toFixed(2);

      if (cst === '00') {
        icmsXml = `<ICMS><ICMS00><orig>${orig}</orig><CST>00</CST><modBC>${modBC}</modBC><vBC>${vBC}</vBC><pICMS>${pICMS}</pICMS><vICMS>${vICMS}</vICMS></ICMS00></ICMS>`;
      } else if (cst === '20') {
        const pRedBC = Number(item.icmsReducaoBaseCalculo || 0).toFixed(2);
        icmsXml = `<ICMS><ICMS20><orig>${orig}</orig><CST>20</CST><modBC>${modBC}</modBC><pRedBC>${pRedBC}</pRedBC><vBC>${vBC}</vBC><pICMS>${pICMS}</pICMS><vICMS>${vICMS}</vICMS></ICMS20></ICMS>`;
      } else if (['40', '41', '50'].includes(cst)) {
        icmsXml = `<ICMS><ICMS40><orig>${orig}</orig><CST>${cst}</CST></ICMS40></ICMS>`;
      } else {
        icmsXml = `<ICMS><ICMS00><orig>${orig}</orig><CST>${cst}</CST><modBC>${modBC}</modBC><vBC>${vBC}</vBC><pICMS>${pICMS}</pICMS><vICMS>${vICMS}</vICMS></ICMS00></ICMS>`;
      }
    }

    // PIS
    const pisCst = item.pisCst || '08';
    let pisXml = '';
    if (['01', '02'].includes(pisCst)) {
      pisXml = `<PIS><PISAliq><CST>${pisCst}</CST><vBC>${Number(item.pisBaseCalculo || 0).toFixed(2)}</vBC><pPIS>${Number(item.pisAliquota || 0).toFixed(2)}</pPIS><vPIS>${Number(item.pisValor || 0).toFixed(2)}</vPIS></PISAliq></PIS>`;
    } else if (['04', '05', '06', '07', '08', '09'].includes(pisCst)) {
      pisXml = `<PIS><PISNT><CST>${pisCst}</CST></PISNT></PIS>`;
    } else {
      pisXml = `<PIS><PISOutr><CST>${pisCst}</CST><vBC>${Number(item.pisBaseCalculo || 0).toFixed(2)}</vBC><pPIS>${Number(item.pisAliquota || 0).toFixed(2)}</pPIS><vPIS>${Number(item.pisValor || 0).toFixed(2)}</vPIS></PISOutr></PIS>`;
    }

    // COFINS
    const cofinsCst = item.cofinsCst || '08';
    let cofinsXml = '';
    if (['01', '02'].includes(cofinsCst)) {
      cofinsXml = `<COFINS><COFINSAliq><CST>${cofinsCst}</CST><vBC>${Number(item.cofinsBaseCalculo || 0).toFixed(2)}</vBC><pCOFINS>${Number(item.cofinsAliquota || 0).toFixed(2)}</pCOFINS><vCOFINS>${Number(item.cofinsValor || 0).toFixed(2)}</vCOFINS></COFINSAliq></COFINS>`;
    } else if (['04', '05', '06', '07', '08', '09'].includes(cofinsCst)) {
      cofinsXml = `<COFINS><COFINSNT><CST>${cofinsCst}</CST></COFINSNT></COFINS>`;
    } else {
      cofinsXml = `<COFINS><COFINSOutr><CST>${cofinsCst}</CST><vBC>${Number(item.cofinsBaseCalculo || 0).toFixed(2)}</vBC><pCOFINS>${Number(item.cofinsAliquota || 0).toFixed(2)}</pCOFINS><vCOFINS>${Number(item.cofinsValor || 0).toFixed(2)}</vCOFINS></COFINSOutr></COFINS>`;
    }

    // IPI
    let ipiXml = '';
    if (item.ipiCst) {
      const cEnq = item.ipiCodigoEnquadramento || '999';
      if (['00', '49', '50', '99'].includes(item.ipiCst)) {
        ipiXml = `<IPI><cEnq>${cEnq}</cEnq><IPITrib><CST>${item.ipiCst}</CST><vBC>${Number(item.ipiBaseCalculo || 0).toFixed(2)}</vBC><pIPI>${Number(item.ipiAliquota || 0).toFixed(2)}</pIPI><vIPI>${Number(item.ipiValor || 0).toFixed(2)}</vIPI></IPITrib></IPI>`;
      } else {
        ipiXml = `<IPI><cEnq>${cEnq}</cEnq><IPINT><CST>${item.ipiCst}</CST></IPINT></IPI>`;
      }
    }

    // DIFAL / FCP (ICMSUFDest)
    let difalXml = '';
    if (item.icmsAliquotaInternaUfDestino || item.fcpPercentualUfDestino) {
      difalXml = `<ICMSUFDest><vBCUFDest>${Number(item.icmsBaseCalculoUfDestino || 0).toFixed(2)}</vBCUFDest><vBCFCPUFDest>${Number(item.fcpBaseCalculoUfDestino || 0).toFixed(2)}</vBCFCPUFDest><pFCPUFDest>${Number(item.fcpPercentualUfDestino || 0).toFixed(2)}</pFCPUFDest><pICMSUFDest>${Number(item.icmsAliquotaInternaUfDestino || 0).toFixed(2)}</pICMSUFDest><pICMSInterPart>${Number(item.icmsPercentualPartilha || 100).toFixed(2)}</pICMSInterPart><vFCPUFDest>${Number(item.fcpValorUfDestino || 0).toFixed(2)}</vFCPUFDest><vICMSUFDest>${Number(item.icmsValorUfDestino || 0).toFixed(2)}</vICMSUFDest><vICMSUFRemet>${Number(item.icmsValorUfRemetente || 0).toFixed(2)}</vICMSUFRemet></ICMSUFDest>`;
    }

    return `<imposto>${icmsXml}${ipiXml}${pisXml}${cofinsXml}${difalXml}</imposto>`;
  }

  private buildTransporteXml(transporte?: any): string {
    if (!transporte) {
      return `<transp><modFrete>9</modFrete></transp>`;
    }

    const modFrete = transporte.modalidadeFrete || '9';
    let transportaXml = '';
    if (transporte.cnpjCpf || transporte.nome) {
      const doc = (transporte.cnpjCpf || '').replace(/\D/g, '');
      const docTag = doc.length === 11 ? `<CPF>${doc}</CPF>` : `<CNPJ>${doc}</CNPJ>`;
      transportaXml = `
      <transporta>
        ${doc ? docTag : ''}
        ${transporte.nome ? `<xNome>${this.escapeXml(transporte.nome)}</xNome>` : ''}
        ${transporte.inscricaoEstadual ? `<IE>${this.escapeXml(transporte.inscricaoEstadual.replace(/\D/g, ''))}</IE>` : ''}
        ${transporte.endereco ? `<xEnder>${this.escapeXml(transporte.endereco)}</xEnder>` : ''}
        ${transporte.municipio ? `<xMun>${this.escapeXml(transporte.municipio)}</xMun>` : ''}
        ${transporte.uf ? `<UF>${this.escapeXml(transporte.uf)}</UF>` : ''}
      </transporta>`;
    }

    let retTranspXml = '';
    if (transporte.icmsRetencao?.valorServico) {
      const r = transporte.icmsRetencao;
      retTranspXml = `
      <retTransp>
        <vServ>${Number(r.valorServico).toFixed(2)}</vServ>
        <vBCRet>${Number(r.baseCalculo || r.valorServico).toFixed(2)}</vBCRet>
        <pICMSRet>${Number(r.aliquota || 0).toFixed(2)}</pICMSRet>
        <vICMSRet>${Number(r.valorIcmsRetido || 0).toFixed(2)}</vICMSRet>
        <CFOP>${r.cfop || '5353'}</CFOP>
        <cMunFG>${r.codigoMunicipio || ''}</cMunFG>
      </retTransp>`;
    }

    let veicTranspXml = '';
    if (transporte.placaVeiculo) {
      veicTranspXml = `
      <veicTransp>
        <placa>${this.escapeXml(transporte.placaVeiculo.replace(/[^a-zA-Z0-9]/g, ''))}</placa>
        ${transporte.ufVeiculo ? `<UF>${this.escapeXml(transporte.ufVeiculo)}</UF>` : ''}
        ${transporte.rntcVeiculo ? `<RNTC>${this.escapeXml(transporte.rntcVeiculo)}</RNTC>` : ''}
      </veicTransp>`;
    }

    let volXml = '';
    if (transporte.volumes && transporte.volumes.length > 0) {
      volXml = transporte.volumes
        .map(
          (v: any) => `
      <vol>
        ${v.quantidade ? `<qVol>${v.quantidade}</qVol>` : ''}
        ${v.especie ? `<esp>${this.escapeXml(v.especie)}</esp>` : ''}
        ${v.marca ? `<marca>${this.escapeXml(v.marca)}</marca>` : ''}
        ${v.numero ? `<nVol>${this.escapeXml(v.numero)}</nVol>` : ''}
        ${v.pesoLiquido ? `<pesoL>${Number(v.pesoLiquido).toFixed(3)}</pesoL>` : ''}
        ${v.pesoBruto ? `<pesoB>${Number(v.pesoBruto).toFixed(3)}</pesoB>` : ''}
      </vol>`,
        )
        .join('');
    }

    return `<transp><modFrete>${modFrete}</modFrete>${transportaXml}${retTranspXml}${veicTranspXml}${volXml}</transp>`;
  }

  private buildCobrancaXml(cobranca?: any, vNF: number = 0, vDesc: number = 0): string {
    if (!cobranca || (!cobranca.fatura && (!cobranca.duplicatas || cobranca.duplicatas.length === 0))) {
      return '';
    }

    let fatXml = '';
    if (cobranca.fatura) {
      const f = cobranca.fatura;
      fatXml = `
      <fat>
        ${f.numero ? `<nFat>${this.escapeXml(f.numero)}</nFat>` : ''}
        <vOrig>${Number(f.valorOriginal || vNF + vDesc).toFixed(2)}</vOrig>
        <vDesc>${Number(f.valorDesconto || vDesc).toFixed(2)}</vDesc>
        <vLiq>${Number(f.valorLiquido || vNF).toFixed(2)}</vLiq>
      </fat>`;
    }

    let dupXml = '';
    if (cobranca.duplicatas && cobranca.duplicatas.length > 0) {
      dupXml = cobranca.duplicatas
        .map(
          (d: any) => `
      <dup>
        <nDup>${this.escapeXml(d.numero)}</nDup>
        <dVenc>${d.dataVencimento}</dVenc>
        <vDup>${Number(d.valor).toFixed(2)}</vDup>
      </dup>`,
        )
        .join('');
    }

    return `<cobr>${fatXml}${dupXml}</cobr>`;
  }

  private buildPagamentoXml(pagamentos?: any[], vNF: number = 0): string {
    if (!pagamentos || pagamentos.length === 0) {
      return `
    <pag>
      <detPag>
        <indPag>0</indPag>
        <tPag>01</tPag>
        <vPag>${vNF.toFixed(2)}</vPag>
      </detPag>
    </pag>`;
    }

    const detPagXml = pagamentos
      .map(
        (p) => `
      <detPag>
        ${p.indicadorPagamento !== undefined ? `<indPag>${p.indicadorPagamento}</indPag>` : '<indPag>0</indPag>'}
        <tPag>${p.formaPagamento || '01'}</tPag>
        <vPag>${Number(p.valorPagamento).toFixed(2)}</vPag>
      </detPag>`,
      )
      .join('');

    return `<pag>${detPagXml}</pag>`;
  }

  /**
   * Monta o XML do Envelope de Lote para envio à SEFAZ (`<enviNFe>`)
   */
  buildEnviNfeXml(xmlNfeAssinado: string, idLote: string, sincrono = true): string {
    const indSinc = sincrono ? '1' : '0';
    return `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <idLote>${idLote}</idLote>
  <indSinc>${indSinc}</indSinc>
  ${xmlNfeAssinado.replace(/<\?xml.*?\?>/, '')}
</enviNFe>`.trim();
  }

  /**
   * Monta o XML de Pedido de Status do Serviço (`<consStatServ>`)
   */
  buildConsStatServXml(codigoUf: string, ambiente: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<consStatServ xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <tpAmb>${ambiente}</tpAmb>
  <cUF>${codigoUf}</cUF>
  <xServ>STATUS</xServ>
</consStatServ>`.trim();
  }

  /**
   * Monta o XML de Evento SEFAZ (Cancelamento ou Carta de Correção)
   */
  buildEventoXml(
    codigoUf: string,
    ambiente: string,
    cnpjEmitente: string,
    chaveAcesso: string,
    tipoEvento: '110111' | '110110', // 110111 = Cancelamento, 110110 = CC-e
    sequenciaEvento: number,
    detalheEventoXml: string,
  ): string {
    const dataHora = new Date().toISOString().replace(/\.\d{3}Z$/, '-03:00');
    const idEvento = `ID${tipoEvento}${chaveAcesso}${String(sequenciaEvento).padStart(2, '0')}`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<evento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <infEvento Id="${idEvento}">
    <cOrgao>${codigoUf}</cOrgao>
    <tpAmb>${ambiente}</tpAmb>
    <CNPJ>${cnpjEmitente.replace(/\D/g, '')}</CNPJ>
    <chNFe>${chaveAcesso}</chNFe>
    <dhEvento>${dataHora}</dhEvento>
    <tpEvento>${tipoEvento}</tpEvento>
    <nSeqEvento>${sequenciaEvento}</nSeqEvento>
    <verEvento>1.00</verEvento>
    <detEvento versao="1.00">
      ${detalheEventoXml}
    </detEvento>
  </infEvento>
</evento>`.trim();
  }

  /**
   * Monta o XML de Envio de Evento (`<envEvento>`)
   */
  buildEnvEventoXml(xmlEventoAssinado: string, idLote: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<envEvento xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.00">
  <idLote>${idLote}</idLote>
  ${xmlEventoAssinado.replace(/<\?xml.*?\?>/, '')}
</envEvento>`.trim();
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
