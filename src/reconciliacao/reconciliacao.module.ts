import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ReconciliacaoController } from './reconciliacao.controller';
import { ReconciliacaoService } from './reconciliacao.service';
import { ArquiveiModule } from '../arquivei/arquivei.module';
import { UauModule } from '../uau/uau.module';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 20000,
      maxRedirects: 5,
    }),
    ArquiveiModule,
    UauModule,
    TenantModule,
  ],
  controllers: [ReconciliacaoController],
  providers: [ReconciliacaoService],
  exports: [ReconciliacaoService],
})
export class ReconciliacaoModule {}
