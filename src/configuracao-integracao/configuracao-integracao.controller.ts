import { Controller, Get, Post, Patch, Delete, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ConfiguracaoIntegracaoService } from './configuracao-integracao.service';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import { CurrentTenant } from '../tenant/decorators/current-tenant.decorator';
import { Tenant } from '../tenant/entities/tenant.entity';

@Controller('configuracoes')
export class ConfiguracaoIntegracaoController {
  constructor(private readonly service: ConfiguracaoIntegracaoService) {}

  @Post()
  async create(@CurrentTenant() tenant: Tenant, @Body() dto: CreateConfigDto) {
    return this.service.create(tenant.id, dto);
  }

  @Get()
  async findAll(@CurrentTenant() tenant: Tenant) {
    return this.service.findAll(tenant.id);
  }

  @Get(':id')
  async findOne(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.service.findOne(tenant.id, id);
  }

  @Patch(':id')
  async update(
    @CurrentTenant() tenant: Tenant,
    @Param('id') id: string,
    @Body() dto: UpdateConfigDto,
  ) {
    return this.service.update(tenant.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    await this.service.delete(tenant.id, id);
  }

  @Post(':id/test-connection')
  async testConnection(@CurrentTenant() tenant: Tenant, @Param('id') id: string) {
    return this.service.testConnection(tenant.id, id);
  }
}
