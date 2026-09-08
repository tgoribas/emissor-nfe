import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantService } from '../../modules/tenant/tenant.service';
import { TenantStatusEnum } from '../../modules/tenant/enum/tenant-status.enum';

/**
 * Autentica o tenant pelo header "x-api-key" e injeta o tenantId na request.
 * O tenant é derivado da chave — o cliente não informa (nem consegue forjar) o próprio ID.
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly tenantService: TenantService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const apiKey = request.headers['x-api-key'];

    if (typeof apiKey !== 'string' || !apiKey) {
      throw new UnauthorizedException('Header x-api-key é obrigatório');
    }

    let tenant;
    try {
      tenant = await this.tenantService.findByApiKey(apiKey);
    } catch {
      throw new UnauthorizedException('API key inválida');
    }

    if (tenant.status !== TenantStatusEnum.ATIVO) {
      throw new ForbiddenException(`Tenant com status ${tenant.status}`);
    }

    request.tenantId = tenant.id;
    request.tenant = tenant;
    return true;
  }
}
