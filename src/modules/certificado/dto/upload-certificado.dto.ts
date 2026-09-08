import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class UploadCertificadoDto {
  @IsUUID()
  @IsNotEmpty()
  emitenteId: string;

  @IsString()
  @IsNotEmpty({ message: 'O arquivo PFX/P12 deve ser enviado em formato Base64' })
  arquivoPfxBase64: string;

  @IsString()
  @IsNotEmpty({ message: 'A senha do certificado digital é obrigatória' })
  senha: string;
}
