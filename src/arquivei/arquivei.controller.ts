import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ArquiveiService } from './arquivei.service';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';
import { Tenant } from '../tenant/entities/tenant.entity';

@Controller('arquivei')
export class ArquiveiController {
  constructor(private readonly arquiveiService: ArquiveiService) {}

  @Get('notas-fiscais')
  async getNotasFiscais(
    @CurrentTenant() tenant: Tenant,
    @Query('cnpj') cnpj: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    if (!cnpj || !startDate || !endDate) {
      throw new HttpException(
        'Os parâmetros cnpj, startDate e endDate são obrigatórios.',
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.arquiveiService.fetchNotasFiscais(tenant.id, cnpj, startDate, endDate);
  }
}
