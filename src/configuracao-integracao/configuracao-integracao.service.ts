import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TenantConfig } from '../tenant/entities/tenant-config.entity';
import { CreateConfigDto } from './dto/create-config.dto';
import { UpdateConfigDto } from './dto/update-config.dto';
import axios from 'axios';

@Injectable()
export class ConfiguracaoIntegracaoService {
  constructor(
    @InjectRepository(TenantConfig)
    private configRepository: Repository<TenantConfig>,
  ) {}

  async create(tenantId: string, dto: CreateConfigDto): Promise<TenantConfig> {
    const config = this.configRepository.create({
      tenantId,
      tipo: dto.tipo,
      config: dto.config,
      ativo: true,
    });

    return this.configRepository.save(config);
  }

  async findAll(tenantId: string): Promise<TenantConfig[]> {
    return this.configRepository.find({
      where: { tenantId },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(tenantId: string, id: string): Promise<TenantConfig> {
    const config = await this.configRepository.findOne({
      where: { tenantId, id },
    });

    if (!config) {
      throw new NotFoundException(`Configuração ${id} não encontrada`);
    }

    return config;
  }

  async update(tenantId: string, id: string, dto: UpdateConfigDto): Promise<TenantConfig> {
    const config = await this.findOne(tenantId, id);

    if (dto.tipo) config.tipo = dto.tipo;
    if (dto.config) config.config = dto.config as any;

    return this.configRepository.save(config);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const config = await this.findOne(tenantId, id);
    await this.configRepository.remove(config);
  }

  async testConnection(tenantId: string, id: string): Promise<{ success: boolean; message: string }> {
    const config = await this.findOne(tenantId, id);

    try {
      if (config.tipo === 'qive') {
        return await this.testQiveConnection(config.config);
      } else if (config.tipo === 'uau') {
        return await this.testUauConnection(config.config);
      } else {
        return { success: false, message: 'Tipo de integração não suportado' };
      }
    } catch (error: any) {
      return { success: false, message: error.message || 'Erro ao testar conexão' };
    }
  }

  private async testQiveConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      const { baseUrl, apiKey } = config;

      if (!baseUrl || !apiKey) {
        return { success: false, message: 'Configuração incompleta: baseUrl e apiKey são obrigatórios' };
      }

      const response = await axios.get(`${baseUrl}/healthcheck`, {
        headers: { 'X-API-Key': apiKey },
        timeout: 10000,
      });

      if (response.status === 200) {
        return { success: true, message: 'Conexão com QIVE estabelecida com sucesso' };
      }

      return { success: false, message: `Status inesperado: ${response.status}` };
    } catch (error: any) {
      return { success: false, message: `Erro ao conectar com QIVE: ${error.message}` };
    }
  }

  private async testUauConnection(config: Record<string, any>): Promise<{ success: boolean; message: string }> {
    try {
      const { baseUrlAuth, integrationToken, login, senha, site } = config;

      if (!baseUrlAuth || !integrationToken || !login || !senha || !site) {
        return {
          success: false,
          message: 'Configuração incompleta: baseUrlAuth, integrationToken, login, senha e site são obrigatórios'
        };
      }

      const payload = {
        login,
        senha,
        UsuarioUAUSite: site,
      };

      const response = await axios.post(baseUrlAuth, payload, {
        headers: {
          'Content-Type': 'application/json',
          'X-INTEGRATION-Authorization': integrationToken,
        },
        timeout: 15000,
      });

      const token = response.data.Authorization || response.data.token || response.data;

      if (token) {
        return { success: true, message: 'Autenticação UAU realizada com sucesso' };
      }

      return { success: false, message: 'Token não retornado pela API UAU' };
    } catch (error: any) {
      return { success: false, message: `Erro ao conectar com UAU: ${error.message}` };
    }
  }
}
