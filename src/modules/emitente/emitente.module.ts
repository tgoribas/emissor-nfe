import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmitenteEntity } from './entity/emitente.entity';
import { EmitenteService } from './emitente.service';
import { EmitenteController } from './emitente.controller';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [TypeOrmModule.forFeature([EmitenteEntity]), TenantModule],
  controllers: [EmitenteController],
  providers: [EmitenteService],
  exports: [EmitenteService],
})
export class EmitenteModule {}
