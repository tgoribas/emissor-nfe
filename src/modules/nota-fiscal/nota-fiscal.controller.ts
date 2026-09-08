import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Res,
  UseGuards,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { NotaFiscalService } from './nota-fiscal.service';
import { EmitirNfeDto } from './dto/emitir-nfe.dto';
import { ApiKeyGuard } from '../../common/guards/api-key.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@Controller('nfe')
@UseGuards(ApiKeyGuard)
export class NotaFiscalController {
  constructor(private readonly notaFiscalService: NotaFiscalService) {}

  @Post('emitir')
  async emitir(@TenantId() tenantId: string, @Body() dto: EmitirNfeDto) {
    return this.notaFiscalService.emitir(tenantId, dto);
  }

  @Post('preview-danfe')
  async previewDanfe(
    @TenantId() tenantId: string,
    @Body() dto: EmitirNfeDto,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.notaFiscalService.gerarPreviewDanfe(tenantId, dto);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="danfe_preview.pdf"');
    return res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Get(':id/danfe')
  async downloadDanfe(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const pdfBuffer = await this.notaFiscalService.obterDanfePdf(id, tenantId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="danfe_${id}.pdf"`);
    return res.status(HttpStatus.OK).send(pdfBuffer);
  }

  @Get(':id/xml')
  async downloadXml(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Res() res: Response,
  ) {
    const xml = await this.notaFiscalService.obterXml(id, tenantId);
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nfe_${id}.xml"`);
    return res.status(HttpStatus.OK).send(xml);
  }

  @Post(':id/cancelar')
  async cancelar(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('justificativa') justificativa: string,
  ) {
    return this.notaFiscalService.cancelar(id, tenantId, justificativa);
  }

  @Post(':id/carta-correcao')
  async cartaCorrecao(
    @Param('id') id: string,
    @TenantId() tenantId: string,
    @Body('correcao') correcao: string,
  ) {
    return this.notaFiscalService.cartaCorrecao(id, tenantId, correcao);
  }

  @Get(':id')
  async findById(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.notaFiscalService.findById(id, tenantId);
  }

  @Get('chave/:chaveAcesso')
  async findByChave(
    @Param('chaveAcesso') chaveAcesso: string,
    @TenantId() tenantId: string,
  ) {
    return this.notaFiscalService.findByChaveAcesso(chaveAcesso, tenantId);
  }

  @Get()
  async findAll(@TenantId() tenantId: string) {
    return this.notaFiscalService.findAllByTenant(tenantId);
  }
}
