import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmitenteEntity } from './entity/emitente.entity';
import { CreateEmitenteDto } from './dto/create-emitente.dto';

@Injectable()
export class EmitenteService {
  constructor(
    @InjectRepository(EmitenteEntity)
    private readonly emitenteRepository: Repository<EmitenteEntity>,
  ) {}

  async create(tenantId: string, dto: CreateEmitenteDto): Promise<EmitenteEntity> {
    const existing = await this.emitenteRepository.findOne({
      where: { tenantId, cnpj: dto.cnpj },
    });

    if (existing) {
      throw new ConflictException(
        'Este CNPJ já está cadastrado para este tenant',
      );
    }

    const emitente = this.emitenteRepository.create({ ...dto, tenantId });
    return this.emitenteRepository.save(emitente);
  }

  async findAllByTenant(tenantId: string): Promise<EmitenteEntity[]> {
    return this.emitenteRepository.find({
      where: { tenantId },
      relations: ['certificado', 'seriesNumeracao'],
    });
  }

  async findByIdAndTenant(id: string, tenantId: string): Promise<EmitenteEntity> {
    const emitente = await this.emitenteRepository.findOne({
      where: { id, tenantId },
      relations: ['certificado', 'seriesNumeracao'],
    });

    if (!emitente) {
      throw new NotFoundException('Emitente não encontrado para este tenant');
    }

    return emitente;
  }

  async findFirstByTenant(tenantId: string): Promise<EmitenteEntity> {
    const emitente = await this.emitenteRepository.findOne({
      where: { tenantId },
      relations: ['certificado', 'seriesNumeracao'],
    });

    if (!emitente) {
      throw new NotFoundException('Nenhum emitente cadastrado para este tenant');
    }

    return emitente;
  }

  async update(
    id: string,
    tenantId: string,
    dto: import('./dto/update-emitente.dto').UpdateEmitenteDto,
  ): Promise<EmitenteEntity> {
    const emitente = await this.findByIdAndTenant(id, tenantId);

    if (dto.cnpj && dto.cnpj !== emitente.cnpj) {
      const existing = await this.emitenteRepository.findOne({
        where: { tenantId, cnpj: dto.cnpj },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Já existe outro emitente com este CNPJ');
      }
    }

    Object.assign(emitente, dto);
    return this.emitenteRepository.save(emitente);
  }
}
