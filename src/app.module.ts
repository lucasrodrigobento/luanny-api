import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule } from '@nestjs/config';
import { UauModule } from './uau/uau.module';
import { ArquiveiModule } from './arquivei/arquivei.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Makes .env variables available project-wide
    }),
    ScheduleModule.forRoot(),
    UauModule,
    ArquiveiModule,
  ],
  controllers: [], // Controllers are now provided by their respective feature modules
  providers: [],   // Services are now provided by their respective feature modules
})
export class AppModule {}
