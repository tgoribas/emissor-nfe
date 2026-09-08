import { IsEmail, IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  nome: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  // require_tld: false permite URLs de desenvolvimento como http://localhost:3001
  @IsUrl({ require_tld: false })
  @IsOptional()
  webhookUrl?: string;
}
