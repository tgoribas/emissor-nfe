import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { StatusNfeEnum } from '../enum/status-nfe.enum';
import { TipoEmissaoNfeEnum } from '../enum/tipo-emissao-nfe.enum';
import { TenantEntity } from '../../tenant/entity/tenant.entity';
import { EmitenteEntity } from '../../emitente/entity/emitente.entity';
import { EventoFiscalEntity } from '../../evento-fiscal/entity/evento-fiscal.entity';

@Entity({ name: 'notas_fiscais' })
@Index(['tenantId', 'emitenteId'])
@Index(['chaveAcesso'])
export class NotaFiscalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.notasFiscais, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'uuid', name: 'emitente_id' })
  emitenteId: string;

  @ManyToOne(() => EmitenteEntity, (emitente) => emitente.notasFiscais, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emitente_id' })
  emitente: EmitenteEntity;

  @Column({ type: 'varchar', length: 100, nullable: true, name: 'referencia_externa' })
  referenciaExterna: string;

  @Column({ type: 'varchar', length: 2, default: '55', name: 'modelo_documento' })
  modeloDocumento: string;

  @Column({ type: 'int' })
  serie: number;

  @Column({ type: 'int' })
  numero: number;

  @Column({ type: 'varchar', length: 44, nullable: true, unique: true, name: 'chave_acesso' })
  chaveAcesso: string;

  @Column({
    type: 'enum',
    enum: StatusNfeEnum,
    default: StatusNfeEnum.PROCESSANDO,
  })
  status: StatusNfeEnum;

  @Column({
    type: 'enum',
    enum: TipoEmissaoNfeEnum,
    default: TipoEmissaoNfeEnum.NORMAL,
    name: 'tipo_emissao',
  })
  tipoEmissao: TipoEmissaoNfeEnum;

  @Column({ type: 'jsonb', name: 'payload_original' })
  payloadOriginal: Record<string, any>;

  @Column({ type: 'text', nullable: true, name: 'xml_gerado' })
  xmlGerado: string;

  @Column({ type: 'text', nullable: true, name: 'xml_assinado' })
  xmlAssinado: string;

  @Column({ type: 'text', nullable: true, name: 'xml_protocolado' })
  xmlProtocolado: string;

  @Column({ type: 'varchar', length: 500, nullable: true, name: 'danfe_pdf_url' })
  danfePdfUrl: string;

  @Column({ type: 'varchar', length: 10, nullable: true, name: 'c_stat' })
  cStat: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'x_motivo' })
  xMotivo: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'protocolo_autorizacao' })
  protocoloAutorizacao: string;

  @Column({ type: 'timestamp', nullable: true, name: 'dh_autorizacao' })
  dhAutorizacao: Date;

  @OneToMany(() => EventoFiscalEntity, (evento) => evento.notaFiscal)
  eventos: EventoFiscalEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
