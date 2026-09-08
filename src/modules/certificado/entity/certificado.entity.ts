import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { CertificadoTipoEnum } from '../enum/certificado-tipo.enum';
import { EmitenteEntity } from '../../emitente/entity/emitente.entity';

@Entity({ name: 'certificados' })
export class CertificadoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'emitente_id', unique: true })
  emitenteId: string;

  @OneToOne(() => EmitenteEntity, (emitente) => emitente.certificado, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emitente_id' })
  emitente: EmitenteEntity;

  @Column({
    type: 'enum',
    enum: CertificadoTipoEnum,
    default: CertificadoTipoEnum.A1,
  })
  tipo: CertificadoTipoEnum;

  @Column({ type: 'text', name: 'arquivo_pfx_base64' })
  arquivoPfxBase64: string;

  @Column({ type: 'varchar', length: 255, name: 'senha_criptografada' })
  senhaCriptografada: string;

  @Column({ type: 'timestamp', name: 'validade_inicio', nullable: true })
  validadeInicio: Date;

  @Column({ type: 'timestamp', name: 'validade_fim', nullable: true })
  validadeFim: Date;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'serial_number' })
  serialNumber: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
