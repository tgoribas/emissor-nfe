import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { TipoEventoFiscalEnum } from '../enum/tipo-evento-fiscal.enum';
import { NotaFiscalEntity } from '../../nota-fiscal/entity/nota-fiscal.entity';

@Entity({ name: 'eventos_fiscais' })
export class EventoFiscalEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'nota_fiscal_id' })
  notaFiscalId: string;

  @ManyToOne(() => NotaFiscalEntity, (nota) => nota.eventos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'nota_fiscal_id' })
  notaFiscal: NotaFiscalEntity;

  @Column({
    type: 'enum',
    enum: TipoEventoFiscalEnum,
    name: 'tipo_evento',
  })
  tipoEvento: TipoEventoFiscalEnum;

  @Column({ type: 'int', default: 1, name: 'sequencia_evento' })
  sequenciaEvento: number;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'varchar', length: 15, nullable: true, name: 'c_stat' })
  cStat: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'x_motivo' })
  xMotivo: string;

  @Column({ type: 'varchar', length: 50, nullable: true, name: 'protocolo_evento' })
  protocoloEvento: string;

  @Column({ type: 'text', nullable: true, name: 'xml_evento' })
  xmlEvento: string;

  @Column({ type: 'text', nullable: true, name: 'xml_retorno' })
  xmlRetorno: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
