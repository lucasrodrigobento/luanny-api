import { Body, Controller, Post } from "@nestjs/common";
import { UauService } from "./uau.service";

@Controller("uau")
export class UauController {
  constructor(private readonly uauService: UauService) {}

  /** 🔍 Endpoint: autentica e consulta processos com base nos parâmetros do body */
  @Post("consultar-processos")
  async consultarProcessos(
    @Body()
    body: {
      empresa: number;
      obra: string;
      periodoInicial: string;
      periodoFinal: string;
    }
  ) {
    const { empresa, obra, periodoInicial, periodoFinal } = body;
    return this.uauService.consultarProcessos({
      empresa,
      obra,
      periodoInicial,
      periodoFinal,
    });
  }

  /** 📄 Endpoint: lista modelos de NF conforme empresa configurada (UAU_EMPRESA) */
  @Post("modelos-nota")
  async getModelosNota() {
    return this.uauService.getModelosNF();
  }

  /** 🧾 Endpoint: gerar nova Nota Fiscal vinculada a um processo */
  @Post("gerar-nota-fiscal")
  async gerarNotaFiscal(@Body() body: any) {
    // body será exatamente o payload esperado pela API do UAU
    return this.uauService.gerarNotaFiscal(body);
  }
}
