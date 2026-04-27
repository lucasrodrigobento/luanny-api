import { Injectable, Logger } from '@nestjs/common';
import { ArquiveiService } from '../arquivei/arquivei.service';
import { UauService } from '../uau/uau.service';
import { TenantService } from '../tenant/tenant.service';
import { GapResultDto } from './dto/gap-result.dto';

@Injectable()
export class ReconciliacaoService {
  private readonly logger = new Logger(ReconciliacaoService.name);

  constructor(
    private readonly arquiveiService: ArquiveiService,
    private readonly uauService: UauService,
    private readonly tenantService: TenantService,
  ) {}

  async calcularGap(
    tenantId: string,
    filtros: { dataInicio?: string; dataFim?: string },
  ): Promise<GapResultDto> {
    const qiveConfig = await this.tenantService.getQiveConfig(tenantId);
    const uauConfig = await this.tenantService.getUauConfig(tenantId);

    const { dataInicio, dataFim } = filtros;
    const startDate = dataInicio || this.getDefaultStartDate();
    const endDate = dataFim || this.getDefaultEndDate();

    this.logger.log(
      `Calculando gap para tenant ${tenantId} no período ${startDate} a ${endDate}`,
    );

    const cnpj = (qiveConfig.config as any).cnpjs?.[0];
    if (!cnpj) {
      throw new Error(`CNPJ não configurado para tenant ${tenantId}`);
    }

    const nfes = await this.arquiveiService.fetchNotasFiscais(
      tenantId,
      cnpj,
      startDate,
      endDate,
    );

    const empresa = (uauConfig.config as any).empresaId || 1;
    const obra = (uauConfig.config as any).obraId || '';

    const processos = await this.uauService.consultarProcessos({
      tenantId,
      empresa,
      obra,
      periodoInicial: startDate,
      periodoFinal: endDate,
    });

    const processosSet = new Set<string>();

    if (Array.isArray(processos)) {
      processos.forEach((processo: any) => {
        const chaveNota = this.extrairChaveNota(processo);
        if (chaveNota) {
          processosSet.add(chaveNota);
        }
      });
    }

    const nfesSemCorrespondencia = nfes
      .filter((nfe: any) => {
        const chaveAcesso = nfe.chave_acesso || nfe.chaveAcesso;
        return chaveAcesso && !processosSet.has(chaveAcesso);
      })
      .map((nfe: any) => ({
        chaveAcesso: nfe.chave_acesso || nfe.chaveAcesso,
        numeroNota: nfe.numero || nfe.numeroNota,
        fornecedor: nfe.emitente?.razao_social || nfe.fornecedor,
        valor: nfe.valor_total || nfe.valor,
        dataEmissao: nfe.data_emissao || nfe.dataEmissao,
        ...nfe,
      }));

    return {
      nfesSemCorrespondencia,
      totalGaps: nfesSemCorrespondencia.length,
      periodoAnalisado: {
        dataInicio: startDate,
        dataFim: endDate,
      },
    };
  }

  private extrairChaveNota(processo: any): string | null {
    return (
      processo.numero_nota ||
      processo.numeroNota ||
      processo.chave_acesso ||
      processo.chaveAcesso ||
      null
    );
  }

  private getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  private getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }
}
