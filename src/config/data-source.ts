import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { databaseSsl } from './database.config';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 5432,
  username: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || process.env.DB_PASS || 'postgres123',
  database: process.env.DB_NAME || 'emissor_nfe_db',
  entities: [__dirname + '/../modules/**/entity/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  logging: process.env.NODE_ENV !== 'production' && process.env.DB_LOGGING === 'true',
  ssl: databaseSsl,
});
