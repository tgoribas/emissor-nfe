import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';
import { TipoDocumentoFiscalEnum } from '../enum/tipo-documento-fiscal.enum';

export class CreateSerieDto {
  @IsUUID()
  @IsNotEmpty()
  emitenteId: string;

  @IsInt()
  @Min(1)
  serie: number;

  @IsEnum(TipoDocumentoFiscalEnum)
  @IsOptional()
  tipoDocumento?: TipoDocumentoFiscalEnum;

  @IsInt()
  @Min(0)
  @IsOptional()
  ultimoNumero?: number;
}
