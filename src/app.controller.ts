import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getStatus() {
    return {
      status: 'online',
      service: 'Gateway Emissor de NF-e Multi-tenant',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        tenants: '/api/v1/tenants',
        emitentes: '/api/v1/emitentes',
        certificados: '/api/v1/certificados',
        series: '/api/v1/series-numeracao',
        nfe: '/api/v1/nfe',
        eventosFiscais: '/api/v1/eventos-fiscais',
        webhooks: '/api/v1/webhooks/logs',
        sefazStatus: '/api/v1/sefaz/status/:emitenteId',
      },
    };
  }
}
