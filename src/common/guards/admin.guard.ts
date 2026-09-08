import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';

/**
 * Protege endpoints administrativos (gestão de tenants).
 * Exige o header "x-admin-key" com o valor de ADMIN_API_KEY (.env).
 */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const adminKey = this.configService.get<string>('ADMIN_API_KEY');

    if (!adminKey) {
      throw new ServiceUnavailableException(
        'ADMIN_API_KEY não configurada no servidor',
      );
    }

    const request = context.switchToHttp().getRequest();
    const provided = request.headers['x-admin-key'];

    if (typeof provided !== 'string' || !this.safeCompare(provided, adminKey)) {
      throw new UnauthorizedException('Chave administrativa inválida');
    }

    return true;
  }

  private safeCompare(a: string, b: string): boolean {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      return false;
    }
    return timingSafeEqual(bufA, bufB);
  }
}
