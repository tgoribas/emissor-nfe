import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventoFiscalEntity } from './entity/evento-fiscal.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { NotaFiscalEntity } from '../nota-fiscal/entity/nota-fiscal.entity';
import { StatusNfeEnum } from '../nota-fiscal/enum/status-nfe.enum';
import { TipoEventoFiscalEnum } from './enum/tipo-evento-fiscal.enum';

@Injectable()
export class EventoFiscalService {
  constructor(
    @InjectRepository(EventoFiscalEntity)
    private readonly eventoRepository: Repository<EventoFiscalEntity>,
    @InjectRepository(NotaFiscalEntity)
    private readonly notaFiscalRepository: Repository<NotaFiscalEntity>,
  ) {}

  async registrarEvento(
    tenantId: string,
    dto: CreateEventoDto,
  ): Promise<EventoFiscalEntity> {
    const nota = await this.notaFiscalRepository.findOne({
      where: { id: dto.notaFiscalId, tenantId },
    });

    if (!nota) {
      throw new NotFoundException('Nota fiscal não encontrada para este tenant');
    }

    const evento = this.eventoRepository.create({
      ...dto,
      sequenciaEvento: dto.sequenciaEvento || 1,
    });

    const eventoSalvo = await this.eventoRepository.save(evento);

    // Se for cancelamento homologado, atualiza o status da nota
    if (dto.tipoEvento === TipoEventoFiscalEnum.CANCELAMENTO) {
      nota.status = StatusNfeEnum.CANCELADA;
      await this.notaFiscalRepository.save(nota);
    }

    return eventoSalvo;
  }

  async findByNotaFiscal(
    notaFiscalId: string,
    tenantId: string,
  ): Promise<EventoFiscalEntity[]> {
    const nota = await this.notaFiscalRepository.findOne({
      where: { id: notaFiscalId, tenantId },
    });

    if (!nota) {
      throw new NotFoundException('Nota fiscal não encontrada para este tenant');
    }

    return this.eventoRepository.find({
      where: { notaFiscalId },
      order: { sequenciaEvento: 'ASC' },
    });
  }
}
