import { Body, Controller, Post } from "@nestjs/common";
import { UauService } from "./uau.service";
import { CurrentTenant } from "../tenant/decorators/current-tenant.decorator";
import { Tenant } from "../tenant/entities/tenant.entity";

@Controller("uau")
export class UauController {
  constructor(private readonly uauService: UauService) {}

  /** 🔍 Endpoint: autentica e consulta processos com base nos parâmetros do body */
  @Post("consultar-processos")
  async consultarProcessos(
    @CurrentTenant() tenant: Tenant,
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
      tenantId: tenant.id,
      empresa,
      obra,
      periodoInicial,
      periodoFinal,
    });
  }

  /** 📄 Endpoint: lista modelos de NF conforme empresa configurada (UAU_EMPRESA) */
  @Post("modelos-nota")
  async getModelosNota(@CurrentTenant() tenant: Tenant) {
    return this.uauService.getModelosNF(tenant.id);
  }

  /** 🧾 Endpoint: gerar nova Nota Fiscal vinculada a um processo */
  @Post("gerar-nota-fiscal")
  async gerarNotaFiscal(
    @CurrentTenant() tenant: Tenant,
    @Body() body: any
  ) {
    // body será exatamente o payload esperado pela API do UAU
    return this.uauService.gerarNotaFiscal(tenant.id, body);
  }
}
