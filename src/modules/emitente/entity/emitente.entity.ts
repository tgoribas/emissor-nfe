import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { RegimeTributarioEnum } from '../enum/regime-tributario.enum';
import { AmbienteSefazEnum } from '../enum/ambiente-sefaz.enum';
import { TenantEntity } from '../../tenant/entity/tenant.entity';
import { CertificadoEntity } from '../../certificado/entity/certificado.entity';
import { SerieNumeracaoEntity } from '../../serie-numeracao/entity/serie-numeracao.entity';
import { NotaFiscalEntity } from '../../nota-fiscal/entity/nota-fiscal.entity';

@Entity({ name: 'emitentes' })
@Index(['tenantId', 'cnpj'], { unique: true })
export class EmitenteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', name: 'tenant_id' })
  tenantId: string;

  @ManyToOne(() => TenantEntity, (tenant) => tenant.emitentes, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: TenantEntity;

  @Column({ type: 'varchar', length: 14 })
  cnpj: string;

  @Column({ type: 'varchar', length: 255, name: 'razao_social' })
  razaoSocial: string;

  @Column({ type: 'varchar', length: 255, nullable: true, name: 'nome_fantasia' })
  nomeFantasia: string;

  @Column({ type: 'varchar', length: 20, name: 'inscricao_estadual' })
  inscricaoEstadual: string;

  @Column({
    type: 'enum',
    enum: RegimeTributarioEnum,
    default: RegimeTributarioEnum.SIMPLES_NACIONAL,
    name: 'regime_tributario',
  })
  regimeTributario: RegimeTributarioEnum;

  @Column({
    type: 'enum',
    enum: AmbienteSefazEnum,
    default: AmbienteSefazEnum.HOMOLOGACAO,
    name: 'ambiente_sefaz',
  })
  ambienteSefaz: AmbienteSefazEnum;

  @Column({ type: 'varchar', length: 2 })
  uf: string;

  @Column({ type: 'varchar', length: 7, name: 'codigo_municipio_ibge' })
  codigoMunicipioIbge: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  logradouro: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  numero: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bairro: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  cep: string;

  @OneToOne(() => CertificadoEntity, (cert) => cert.emitente)
  certificado: CertificadoEntity;

  @OneToMany(() => SerieNumeracaoEntity, (serie) => serie.emitente)
  seriesNumeracao: SerieNumeracaoEntity[];

  @OneToMany(() => NotaFiscalEntity, (nota) => nota.emitente)
  notasFiscais: NotaFiscalEntity[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
