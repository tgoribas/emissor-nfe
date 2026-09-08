import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { RegimeTributarioEnum } from '../enum/regime-tributario.enum';
import { AmbienteSefazEnum } from '../enum/ambiente-sefaz.enum';

// O tenantId não é aceito no payload: é derivado da API key pelo ApiKeyGuard
export class CreateEmitenteDto {
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve conter exatamente 14 dígitos numéricos' })
  cnpj: string;

  @IsString()
  @IsNotEmpty()
  razaoSocial: string;

  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @IsString()
  @IsNotEmpty()
  inscricaoEstadual: string;

  @IsEnum(RegimeTributarioEnum)
  @IsNotEmpty()
  regimeTributario: RegimeTributarioEnum;

  @IsEnum(AmbienteSefazEnum)
  @IsOptional()
  ambienteSefaz?: AmbienteSefazEnum;

  @IsString()
  @Length(2, 2, { message: 'UF deve ter exatamente 2 caracteres' })
  uf: string;

  @IsString()
  @Length(7, 7, { message: 'Código IBGE do município deve conter 7 dígitos' })
  codigoMunicipioIbge: string;

  @IsString()
  @IsOptional()
  logradouro?: string;

  @IsString()
  @IsOptional()
  numero?: string;

  @IsString()
  @IsOptional()
  bairro?: string;

  @IsString()
  @IsOptional()
  cep?: string;
}
