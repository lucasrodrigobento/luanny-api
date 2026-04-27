import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import cors from "cors";
import * as dotenv from "dotenv"; // 👈 importa o dotenv

dotenv.config(); // 👈 carrega as variáveis de ambiente do .env

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cors());
  const port = process.env.PORT || 8000;
  await app.listen(port);
  console.log(`🚀 API NF-e rodando em http://localhost:${port}`);
}
bootstrap();
