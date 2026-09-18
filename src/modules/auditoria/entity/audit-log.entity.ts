import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { CredencialAuditoriaEnum } from '../enum/credencial-auditoria.enum';

/**
 * Registro de operações de tratamento (Art. 37 LGPD). Append-only:
 * nenhum endpoint de edição/exclusão — apenas o expurgo por retenção.
 * Guarda referências (IDs, hash do documento), nunca dados pessoais em si.
 */
@Entity({ name: 'audit_logs' })
@Index(['tenantId', 'createdAt'])
@Index(['documentoHash'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id', nullable: true })
  tenantId: string | null;

  @Column({
    type: 'enum',
    enum: CredencialAuditoriaEnum,
    default: CredencialAuditoriaEnum.NAO_AUTENTICADA,
  })
  credencial: CredencialAuditoriaEnum;

  @Column({ type: 'varchar', length: 64 })
  ip: string;

  @Column({ type: 'varchar', length: 10 })
  metodo: string;

  // Path sem query string — a query de /lgpd/titular carrega CPF em claro
  @Column({ type: 'varchar', length: 500 })
  rota: string;

  @Column({ type: 'varchar', length: 50, name: 'recurso_tipo', nullable: true })
  recursoTipo: string | null;

  @Column({ type: 'varchar', length: 100, name: 'recurso_id', nullable: true })
  recursoId: string | null;

  // sha256 do CPF/CNPJ normalizado (rotas /lgpd) — permite localizar acessos
  // ao titular sem armazenar o documento
  @Column({ type: 'varchar', length: 64, name: 'documento_hash', nullable: true })
  documentoHash: string | null;

  @Column({ type: 'int', name: 'http_status' })
  httpStatus: number;

  @Column({ type: 'boolean' })
  sucesso: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
