import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UauModule } from './uau/uau.module';
import { ArquiveiModule } from './arquivei/arquivei.module';
import { TenantModule } from './tenant/tenant.module';
import { ReconciliacaoModule } from './reconciliacao/reconciliacao.module';
import { ConfiguracaoIntegracaoModule } from './configuracao-integracao/configuracao-integracao.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: false,
    }),
    ScheduleModule.forRoot(),
    TenantModule,
    UauModule,
    ArquiveiModule,
    ReconciliacaoModule,
    ConfiguracaoIntegracaoModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
