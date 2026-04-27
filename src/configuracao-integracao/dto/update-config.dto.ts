import { TipoIntegracao } from '../../tenant/entities/tenant-config.entity';

export class UpdateConfigDto {
  tipo?: TipoIntegracao;
  config?: Record<string, any>;
}
