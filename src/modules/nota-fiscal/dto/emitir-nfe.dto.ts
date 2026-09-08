import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TipoEmissaoNfeEnum } from '../enum/tipo-emissao-nfe.enum';

export class DestinatarioDto {
  @IsString()
  @IsNotEmpty()
  cpfCnpj: string;

  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsString()
  @IsOptional()
  inscricaoEstadual?: string;

  @IsString()
  @IsOptional()
  indicadorIeDest?: string; // 1 = Contribuinte, 2 = Isento, 9 = Nao Contribuinte

  @IsString()
  @IsNotEmpty()
  logradouro: string;

  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsOptional()
  complemento?: string;

  @IsString()
  @IsNotEmpty()
  bairro: string;

  @IsString()
  @IsNotEmpty()
  codigoMunicipioIbge: string;

  @IsString()
  @IsOptional()
  municipio?: string;

  @IsString()
  @IsNotEmpty()
  uf: string;

  @IsString()
  @IsNotEmpty()
  cep: string;

  @IsString()
  @IsOptional()
  telefone?: string;

  @IsString()
  @IsOptional()
  email?: string;
}

export class ItemNfeDto {
  @IsInt()
  @Min(1)
  @IsOptional()
  numeroItem?: number;

  @IsString()
  @IsNotEmpty()
  codigo: string;

  @IsString()
  @IsNotEmpty()
  descricao: string;

  @IsString()
  @IsNotEmpty()
  ncm: string;

  @IsString()
  @IsNotEmpty()
  cfop: string;

  @IsString()
  @IsNotEmpty()
  unidadeComercial: string;

  @IsNumber()
  @Min(0.0001)
  quantidadeComercial: number;

  @IsNumber()
  @Min(0)
  valorUnitario: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  valorTotalBruto?: number;

  @IsString()
  @IsOptional()
  codigoBarras?: string;

  @IsString()
  @IsOptional()
  origem?: string; // 0 a 8

  // ICMS
  @IsString()
  @IsOptional()
  icmsCst?: string; // 00, 20, 40, 41, 50, etc.

  @IsString()
  @IsOptional()
  icmsModBc?: string;

  @IsNumber()
  @IsOptional()
  icmsReducaoBaseCalculo?: number;

  @IsNumber()
  @IsOptional()
  icmsBaseCalculo?: number;

  @IsNumber()
  @IsOptional()
  icmsAliquota?: number;

  @IsNumber()
  @IsOptional()
  icmsValorTotal?: number;

  @IsString()
  @IsOptional()
  codigoBeneficioFiscal?: string;

  // PIS
  @IsString()
  @IsOptional()
  pisCst?: string;

  @IsNumber()
  @IsOptional()
  pisBaseCalculo?: number;

  @IsNumber()
  @IsOptional()
  pisAliquota?: number;

  @IsNumber()
  @IsOptional()
  pisValor?: number;

  // COFINS
  @IsString()
  @IsOptional()
  cofinsCst?: string;

  @IsNumber()
  @IsOptional()
  cofinsBaseCalculo?: number;

  @IsNumber()
  @IsOptional()
  cofinsAliquota?: number;

  @IsNumber()
  @IsOptional()
  cofinsValor?: number;

  // IPI
  @IsString()
  @IsOptional()
  ipiCst?: string;

  @IsString()
  @IsOptional()
  ipiCodigoEnquadramento?: string;

  @IsNumber()
  @IsOptional()
  ipiBaseCalculo?: number;

  @IsNumber()
  @IsOptional()
  ipiAliquota?: number;

  @IsNumber()
  @IsOptional()
  ipiValor?: number;

  // Reforma Tributária (IBS / CBS 2026)
  @IsString()
  @IsOptional()
  ibsCbsCst?: string;

  @IsString()
  @IsOptional()
  ibsCbsClassificacaoTributaria?: string;

  @IsNumber()
  @IsOptional()
  ibsCbsBaseCalculo?: number;

  @IsNumber()
  @IsOptional()
  ibsUfAliquota?: number;

  @IsNumber()
  @IsOptional()
  ibsUfValor?: number;

  @IsNumber()
  @IsOptional()
  ibsMunAliquota?: number;

  @IsNumber()
  @IsOptional()
  ibsMunValor?: number;

  @IsNumber()
  @IsOptional()
  cbsAliquota?: number;

  @IsNumber()
  @IsOptional()
  cbsValor?: number;

  // DIFAL / FCP
  @IsNumber()
  @IsOptional()
  fcpPercentualUfDestino?: number;

  @IsNumber()
  @IsOptional()
  icmsPercentualPartilha?: number;

  @IsNumber()
  @IsOptional()
  icmsAliquotaInternaUfDestino?: number;

  @IsNumber()
  @IsOptional()
  fcpValorUfDestino?: number;

  @IsNumber()
  @IsOptional()
  icmsValorUfDestino?: number;

  @IsNumber()
  @IsOptional()
  icmsValorUfRemetente?: number;

  @IsNumber()
  @IsOptional()
  icmsBaseCalculoUfDestino?: number;

  @IsNumber()
  @IsOptional()
  fcpBaseCalculoUfDestino?: number;

  // Pedido de compra
  @IsString()
  @IsOptional()
  pedidoCompra?: string;

  @IsString()
  @IsOptional()
  numeroItemPedidoCompra?: string;

  @IsObject()
  @IsOptional()
  impostos?: Record<string, any>;
}

export class DuplicataDto {
  @IsString()
  @IsNotEmpty()
  numero: string;

  @IsString()
  @IsNotEmpty()
  dataVencimento: string;

  @IsNumber()
  @Min(0)
  valor: number;
}

export class FaturaDto {
  @IsString()
  @IsOptional()
  numero?: string;

  @IsNumber()
  @IsOptional()
  valorOriginal?: number;

  @IsNumber()
  @IsOptional()
  valorDesconto?: number;

  @IsNumber()
  @IsOptional()
  valorLiquido?: number;
}

export class PagamentoItemDto {
  @IsString()
  @IsNotEmpty()
  formaPagamento: string; // ex: 01=Dinheiro, 15=Boleto, 90=Sem Pagamento, etc.

  @IsNumber()
  @Min(0)
  valorPagamento: number;

  @IsString()
  @IsOptional()
  indicadorPagamento?: string; // 0=A Vista, 1=A Prazo
}

export class VolumeDto {
  @IsNumber()
  @IsOptional()
  quantidade?: number;

  @IsString()
  @IsOptional()
  especie?: string;

  @IsString()
  @IsOptional()
  marca?: string;

  @IsString()
  @IsOptional()
  numero?: string;

  @IsNumber()
  @IsOptional()
  pesoLiquido?: number;

  @IsNumber()
  @IsOptional()
  pesoBruto?: number;
}

export class RetencaoIcmsTransporteDto {
  @IsNumber()
  @IsOptional()
  valorServico?: number;

  @IsNumber()
  @IsOptional()
  baseCalculo?: number;

  @IsNumber()
  @IsOptional()
  aliquota?: number;

  @IsNumber()
  @IsOptional()
  valorIcmsRetido?: number;

  @IsString()
  @IsOptional()
  cfop?: string;

  @IsString()
  @IsOptional()
  codigoMunicipio?: string;
}

export class TransporteDto {
  @IsString()
  @IsOptional()
  modalidadeFrete?: string; // 0=Emitente, 1=Destinatario, 2=Terceiros, 9=Sem Frete

  @IsString()
  @IsOptional()
  cnpjCpf?: string;

  @IsString()
  @IsOptional()
  nome?: string;

  @IsString()
  @IsOptional()
  inscricaoEstadual?: string;

  @IsString()
  @IsOptional()
  endereco?: string;

  @IsString()
  @IsOptional()
  municipio?: string;

  @IsString()
  @IsOptional()
  uf?: string;

  @IsString()
  @IsOptional()
  placaVeiculo?: string;

  @IsString()
  @IsOptional()
  ufVeiculo?: string;

  @IsString()
  @IsOptional()
  rntcVeiculo?: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => VolumeDto)
  volumes?: VolumeDto[];

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => RetencaoIcmsTransporteDto)
  icmsRetencao?: RetencaoIcmsTransporteDto;
}

export class CobrancaDto {
  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => FaturaDto)
  fatura?: FaturaDto;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DuplicataDto)
  duplicatas?: DuplicataDto[];
}

export class EmitirNfeDto {
  @IsUUID()
  @IsNotEmpty()
  emitenteId: string;

  @IsString()
  @IsOptional()
  referenciaExterna?: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  serie?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  numero?: number;

  @IsEnum(TipoEmissaoNfeEnum)
  @IsOptional()
  tipoEmissao?: TipoEmissaoNfeEnum;

  @IsString()
  @IsOptional()
  tipoDocumento?: string; // 1 = Saída, 0 = Entrada

  @IsString()
  @IsOptional()
  finalidadeEmissao?: string; // 1 = Normal, 2 = Complementar, 3 = Ajuste, 4 = Devolução

  @IsString()
  @IsOptional()
  presencaComprador?: string; // 0, 1, 2, 3, 4, 9

  @IsString()
  @IsOptional()
  consumidorFinal?: string; // 0 = Não, 1 = Sim

  @IsString()
  @IsOptional()
  dataEmissao?: string;

  @IsString()
  @IsOptional()
  dataSaidaEntrada?: string;

  @IsString()
  @IsNotEmpty()
  naturezaOperacao: string;

  @ValidateNested()
  @Type(() => DestinatarioDto)
  destinatario: DestinatarioDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemNfeDto)
  itens: ItemNfeDto[];

  @IsNumber()
  @IsOptional()
  valorFrete?: number;

  @IsNumber()
  @IsOptional()
  valorSeguro?: number;

  @IsNumber()
  @IsOptional()
  valorDesconto?: number;

  @IsNumber()
  @IsOptional()
  valorOutrasDespesas?: number;

  @IsNumber()
  @IsOptional()
  valorTotalNfe?: number;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PagamentoItemDto)
  pagamentos?: PagamentoItemDto[];

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => CobrancaDto)
  cobranca?: CobrancaDto;

  @IsObject()
  @IsOptional()
  @ValidateNested()
  @Type(() => TransporteDto)
  transporte?: TransporteDto;

  @IsString()
  @IsOptional()
  informacoesComplementares?: string;

  @IsString()
  @IsOptional()
  informacoesAdicionaisFisco?: string;
}
