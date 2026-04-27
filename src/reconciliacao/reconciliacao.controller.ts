import { Controller, Post, Body } from '@nestjs/common';
import { ReconciliacaoService } from './reconciliacao.service';
import { FiltrosReconciliacaoDto } from './dto/filtros-reconciliacao.dto';
import { GapResultDto } from './dto/gap-result.dto';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';
import { Tenant } from '../tenant/entities/tenant.entity';

@Controller('reconciliacao')
export class ReconciliacaoController {
  constructor(private readonly reconciliacaoService: ReconciliacaoService) {}

  @Post('calcular-gap')
  async calcularGap(
    @CurrentTenant() tenant: Tenant,
    @Body() filtros: FiltrosReconciliacaoDto,
  ): Promise<GapResultDto> {
    return this.reconciliacaoService.calcularGap(tenant.id, filtros);
  }
}
