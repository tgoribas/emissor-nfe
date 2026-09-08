import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { TipoDocumentoFiscalEnum } from '../enum/tipo-documento-fiscal.enum';
import { EmitenteEntity } from '../../emitente/entity/emitente.entity';

@Entity({ name: 'series_numeracao' })
@Index(['emitenteId', 'serie', 'tipoDocumento'], { unique: true })
export class SerieNumeracaoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'emitente_id' })
  emitenteId: string;

  @ManyToOne(() => EmitenteEntity, (emitente) => emitente.seriesNumeracao, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'emitente_id' })
  emitente: EmitenteEntity;

  @Column({ type: 'int' })
  serie: number;

  @Column({
    type: 'enum',
    enum: TipoDocumentoFiscalEnum,
    default: TipoDocumentoFiscalEnum.NFE,
    name: 'tipo_documento',
  })
  tipoDocumento: TipoDocumentoFiscalEnum;

  @Column({ type: 'int', default: 0, name: 'ultimo_numero' })
  ultimoNumero: number;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
