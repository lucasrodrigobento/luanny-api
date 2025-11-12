import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ArquiveiController } from './arquivei.controller';
import { ArquiveiService } from './arquivei.service';

@Module({
  imports: [
    HttpModule.register({
      timeout: 20000,
      maxRedirects: 5,
    }),
  ],
  controllers: [ArquiveiController],
  providers: [ArquiveiService],
})
export class ArquiveiModule {}
