import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ArquiveiController } from './arquivei.controller';
import { ArquiveiService } from './arquivei.service';
import { TenantModule } from '../tenant/tenant.module';

@Module({
  imports: [
    HttpModule.register({
      timeout: 20000,
      maxRedirects: 5,
    }),
    TenantModule,
  ],
  controllers: [ArquiveiController],
  providers: [ArquiveiService],
  exports: [ArquiveiService],
})
export class ArquiveiModule {}
