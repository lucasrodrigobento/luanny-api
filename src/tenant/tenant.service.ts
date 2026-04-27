import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';
import { TenantConfig } from './entities/tenant-config.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private tenantRepository: Repository<Tenant>,
    @InjectRepository(TenantConfig)
    private configRepository: Repository<TenantConfig>,
  ) {}

  async findBySlug(slug: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { slug, ativo: true },
      relations: ['configs'],
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com slug "${slug}" não encontrado`);
    }

    return tenant;
  }

  async getTenantConfigs(tenantId: string): Promise<TenantConfig[]> {
    return this.configRepository.find({
      where: { tenantId, ativo: true },
    });
  }

  async getQiveConfig(tenantId: string): Promise<TenantConfig> {
    const config = await this.configRepository.findOne({
      where: { tenantId, tipo: 'qive', ativo: true },
    });

    if (!config) {
      throw new NotFoundException(`Configuração Qive não encontrada para tenant ${tenantId}`);
    }

    return config;
  }

  async getUauConfig(tenantId: string): Promise<TenantConfig> {
    const config = await this.configRepository.findOne({
      where: { tenantId, tipo: 'uau', ativo: true },
    });

    if (!config) {
      throw new NotFoundException(`Configuração UAU não encontrada para tenant ${tenantId}`);
    }

    return config;
  }
}
