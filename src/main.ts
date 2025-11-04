import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cors from "cors";
import * as dotenv from "dotenv"; // 👈 importa o dotenv

dotenv.config(); // 👈 carrega as variáveis de ambiente do .env

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors());
  await app.listen(8000);
  console.log(`🚀 API NF-e rodando em http://localhost:8000`);
}
bootstrap();
