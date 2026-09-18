import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';

dotenv.config();

// Em produção, synchronize (risco de perda de dados) e logging (SQL com dados
// pessoais — CPF, endereços, certificados — indo para stdout, vedado pela LGPD)
// ficam desligados independentemente do .env.
const isProduction = process.env.NODE_ENV === 'production';

// TLS na conexão com o Postgres (DB_SSL=true); DB_SSL_REJECT_UNAUTHORIZED=false
// aceita certificados autoassinados (comum em bancos gerenciados)
export const databaseSsl =
  process.env.DB_SSL === 'true'
    ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
    : undefined;

export const databaseConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres123',
  database: process.env.DB_NAME || 'emissor_nfe_db',
  entities: [__dirname + '/../modules/**/entity/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: !isProduction && process.env.DB_SYNCHRONIZE === 'true',
  logging: !isProduction && process.env.DB_LOGGING === 'true',
  ssl: databaseSsl,
  autoLoadEntities: true,
};
