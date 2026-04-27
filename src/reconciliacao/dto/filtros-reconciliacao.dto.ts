import { IsOptional, IsString } from 'class-validator';

export class FiltrosReconciliacaoDto {
  @IsOptional()
  @IsString()
  dataInicio?: string;

  @IsOptional()
  @IsString()
  dataFim?: string;
}
