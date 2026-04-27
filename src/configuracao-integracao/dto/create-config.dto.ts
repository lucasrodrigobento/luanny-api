import { TipoIntegracao } from '../../tenant/entities/tenant-config.entity';

export class CreateConfigDto {
  tipo: TipoIntegracao;
  config: Record<string, any>;
}
