import {
  IsEnum,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';
import { RegimeTributarioEnum } from '../enum/regime-tributario.enum';
import { AmbienteSefazEnum } from '../enum/ambiente-sefaz.enum';

export class UpdateEmitenteDto {
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve conter exatamente 14 dígitos numéricos' })
  @IsOptional()
  cnpj?: string;

  @IsString()
  @IsOptional()
  razaoSocial?: string;

  @IsString()
  @IsOptional()
  nomeFantasia?: string;

  @IsString()
  @IsOptional()
  inscricaoEstadual?: string;

  @IsEnum(RegimeTributarioEnum)
  @IsOptional()
  regimeTributario?: RegimeTributarioEnum;

  @IsEnum(AmbienteSefazEnum)
  @IsOptional()
  ambienteSefaz?: AmbienteSefazEnum;

  @IsString()
  @Length(2, 2, { message: 'UF deve ter exatamente 2 caracteres' })
  @IsOptional()
  uf?: string;

  @IsString()
  @Length(7, 7, { message: 'Código IBGE do município deve conter 7 dígitos' })
  @IsOptional()
  codigoMunicipioIbge?: string;

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
