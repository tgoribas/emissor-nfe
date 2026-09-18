import { IsNotEmpty, IsString } from 'class-validator';

export class TitularLgpdDto {
  // CPF (11 dígitos) ou CNPJ (14 dígitos), com ou sem pontuação
  @IsString()
  @IsNotEmpty()
  cpfCnpj: string;
}
