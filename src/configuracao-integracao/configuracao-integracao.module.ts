import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantConfig } from '../tenant/entities/tenant-config.entity';
import { TenantModule } from '../tenant/tenant.module';
import { ConfiguracaoIntegracaoController } from './configuracao-integracao.controller';
import { ConfiguracaoIntegracaoService } from './configuracao-integracao.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([TenantConfig]),
    TenantModule,
  ],
  controllers: [ConfiguracaoIntegracaoController],
  providers: [ConfiguracaoIntegracaoService],
  exports: [ConfiguracaoIntegracaoService],
})
export class ConfiguracaoIntegracaoModule {}
