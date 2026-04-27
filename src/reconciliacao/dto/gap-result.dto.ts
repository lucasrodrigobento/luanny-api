export class GapResultDto {
  nfesSemCorrespondencia: Array<{
    chaveAcesso: string;
    numeroNota: string;
    fornecedor: string;
    valor: number;
    dataEmissao: string;
    [key: string]: any;
  }>;

  totalGaps: number;
  periodoAnalisado: {
    dataInicio?: string;
    dataFim?: string;
  };
}
