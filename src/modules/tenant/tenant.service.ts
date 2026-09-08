import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantEntity } from './entity/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { createHash, randomBytes } from 'crypto';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(TenantEntity)
    private readonly tenantRepository: Repository<TenantEntity>,
  ) {}

  async create(dto: CreateTenantDto): Promise<TenantEntity> {
    const existing = await this.tenantRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new ConflictException('Já existe um tenant cadastrado com este e-mail');
    }

    const apiKey = `nfe_${randomBytes(24).toString('hex')}`;

    const tenant = this.tenantRepository.create({
      ...dto,
      apiKey: this.hashApiKey(apiKey),
    });

    const saved = await this.tenantRepository.save(tenant);

    // A chave em claro é retornada UMA única vez; no banco fica apenas o hash
    return { ...saved, apiKey };
  }

  async findAll(): Promise<TenantEntity[]> {
    return this.tenantRepository.find({
      relations: ['emitentes'],
    });
  }

  async findById(id: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
      relations: ['emitentes'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} não encontrado`);
    }

    return tenant;
  }

  async findByApiKey(apiKey: string): Promise<TenantEntity> {
    const tenant = await this.tenantRepository.findOne({
      where: { apiKey: this.hashApiKey(apiKey) },
    });

    if (!tenant) {
      throw new NotFoundException('ApiKey inválida ou tenant não encontrado');
    }

    return tenant;
  }

  private hashApiKey(apiKey: string): string {
    return createHash('sha256').update(apiKey).digest('hex');
  }
}
