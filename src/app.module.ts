import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SefazService } from "./sefaz/sefaz.service";
import { SefazController } from "./sefaz/sefaz.controller";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SefazController],
  providers: [SefazService],
})
export class AppModule {}
