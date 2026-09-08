import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
} from 'class-validator';
import { TipoEventoFiscalEnum } from '../enum/tipo-evento-fiscal.enum';

export class CreateEventoDto {
  @IsUUID()
  @IsNotEmpty()
  notaFiscalId: string;

  @IsEnum(TipoEventoFiscalEnum)
  @IsNotEmpty()
  tipoEvento: TipoEventoFiscalEnum;

  @IsString()
  @IsNotEmpty()
  @MinLength(15, { message: 'A justificativa ou correção deve conter no mínimo 15 caracteres' })
  descricao: string;

  @IsInt()
  @Min(1)
  @IsOptional()
  sequenciaEvento?: number;
}
