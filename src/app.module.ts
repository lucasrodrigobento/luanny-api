import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { SefazService } from "./sefaz/sefaz.service";
import { SefazController } from "./sefaz/sefaz.controller";
import { UauController } from "./uau/uau.controller";
import { UauService } from "./uau/uau.service";

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [SefazController, UauController],
  providers: [SefazService, UauService],
})
export class AppModule {}
