import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrai o tenantId injetado pelo ApiKeyGuard na request.
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    return ctx.switchToHttp().getRequest().tenantId;
  },
);
