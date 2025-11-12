import { Module } from '@nestjs/common';
import { UauController } from './uau.controller';
import { UauService } from './uau.service';

@Module({
  controllers: [UauController],
  providers: [UauService],
  exports: [UauService], // se outro módulo precisar do service
})
export class UauModule {}
