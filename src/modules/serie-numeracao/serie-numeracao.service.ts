import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { SerieNumeracaoEntity } from './entity/serie-numeracao.entity';
import { CreateSerieDto } from './dto/create-serie.dto';
import { TipoDocumentoFiscalEnum } from './enum/tipo-documento-fiscal.enum';

@Injectable()
export class SerieNumeracaoService {
  constructor(
    @InjectRepository(SerieNumeracaoEntity)
    private readonly serieRepository: Repository<SerieNumeracaoEntity>,
  ) {}

  async create(dto: CreateSerieDto): Promise<SerieNumeracaoEntity> {
    const tipo = dto.tipoDocumento || TipoDocumentoFiscalEnum.NFE;
    const existing = await this.serieRepository.findOne({
      where: {
        emitenteId: dto.emitenteId,
        serie: dto.serie,
        tipoDocumento: tipo,
      },
    });

    if (existing) {
      throw new ConflictException(
        `A série ${dto.serie} para o modelo ${tipo} já está cadastrada`,
      );
    }

    const serie = this.serieRepository.create({
      ...dto,
      tipoDocumento: tipo,
      ultimoNumero: dto.ultimoNumero || 0,
    });

    return this.serieRepository.save(serie);
  }

  async findByEmitente(emitenteId: string): Promise<SerieNumeracaoEntity[]> {
    return this.serieRepository.find({
      where: { emitenteId, ativo: true },
    });
  }

  /**
   * Obtém e incrementa de forma atômica o próximo número da NF-e dentro de uma transação.
   */
  async getNextNumberAndIncrement(
    emitenteId: string,
    serie: number,
    tipoDocumento: TipoDocumentoFiscalEnum,
    transactionalManager?: EntityManager,
  ): Promise<number> {
    const manager = transactionalManager || this.serieRepository.manager;

    // Bloqueia a linha da série para evitar concorrência simultânea
    const serieRecord = await manager
      .createQueryBuilder(SerieNumeracaoEntity, 'serie')
      .setLock('pessimistic_write')
      .where('serie.emitente_id = :emitenteId', { emitenteId })
      .andWhere('serie.serie = :serie', { serie })
      .andWhere('serie.tipo_documento = :tipoDocumento', { tipoDocumento })
      .getOne();

    if (!serieRecord) {
      throw new NotFoundException(
        `Série ${serie} do modelo ${tipoDocumento} não encontrada para o emitente`,
      );
    }

    const proximoNumero = serieRecord.ultimoNumero + 1;
    serieRecord.ultimoNumero = proximoNumero;
    await manager.save(serieRecord);

    return proximoNumero;
  }

  async updateNumero(
    emitenteId: string,
    serie: number,
    tipoDocumento: TipoDocumentoFiscalEnum,
    ultimoNumero: number,
  ): Promise<SerieNumeracaoEntity> {
    let serieRecord = await this.serieRepository.findOne({
      where: { emitenteId, serie, tipoDocumento },
    });

    if (!serieRecord) {
      serieRecord = this.serieRepository.create({
        emitenteId,
        serie,
        tipoDocumento,
        ultimoNumero,
      });
    } else {
      serieRecord.ultimoNumero = ultimoNumero;
    }

    return this.serieRepository.save(serieRecord);
  }
}
