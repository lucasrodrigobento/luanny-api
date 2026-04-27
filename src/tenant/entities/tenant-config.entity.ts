import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Tenant } from './tenant.entity';

export type TipoIntegracao = 'qive' | 'uau';

export enum IntegrationType {
  QIVE = 'qive',
  UAU = 'uau',
}

export interface QiveConfig {
  baseUrl: string;
  apiId: string;
  apiKey: string;
  cnpjs: string[];
}

export interface UauConfig {
  baseUrl: string;
  baseUrlAuth?: string;
  baseUrlProcesso?: string;
  baseUrlGerarNF?: string;
  integrationToken: string;
  login: string;
  senha: string;
  site: string;
  empresa?: string;
}

export type ConfigData = QiveConfig | UauConfig;

@Entity('tenant_configs')
@Index(['tenantId', 'tipo'])
export class TenantConfig {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'tenant_id' })
  tenantId!: string;

  @Column({ type: 'varchar' })
  tipo!: TipoIntegracao;

  @Column({ type: 'jsonb' })
  config!: ConfigData;

  @Column({ default: true })
  ativo!: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @ManyToOne(() => Tenant, (tenant) => tenant.configs)
  @JoinColumn({ name: 'tenant_id' })
  tenant!: Tenant;
}
