import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { TenantStatusEnum } from '../enum/tenant-status.enum';
import { EmitenteEntity } from '../../emitente/entity/emitente.entity';
import { NotaFiscalEntity } from '../../nota-fiscal/entity/nota-fiscal.entity';

@Entity({ name: 'tenants' })
export class TenantEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  nome: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  // Armazena o hash SHA-256 da chave; o valor em claro só é exibido na criação
  @Column({ type: 'varchar', length: 255, unique: true, name: 'api_key', select: false })
  apiKey: string;

  @Column({
    type: 'enum',
    enum: TenantStatusEnum,
    default: TenantStatusEnum.ATIVO,
  })
  status: TenantStatusEnum;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'webhook_url' })
  webhookUrl: string;

  @OneToMany(() => EmitenteEntity, (emitente) => emitente.tenant)
  emitentes: EmitenteEntity[];

  @OneToMany(() => NotaFiscalEntity, (nota) => nota.tenant)
  notasFiscais: NotaFiscalEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
