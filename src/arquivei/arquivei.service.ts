import { Injectable, HttpException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ArquiveiService {
  private readonly logger = new Logger(ArquiveiService.name);
  private readonly apiUrl = 'https://api.arquivei.com.br/v1/nfe/received';

  constructor(private readonly httpService: HttpService) {}

  async fetchNotasFiscais(
    cnpj: string,
    startDate: string,
    endDate: string,
  ): Promise<any[]> {
    const apiId = process.env.ARQUIVEI_API_ID;
    const apiKey = process.env.ARQUIVEI_API_KEY;

    if (!apiId || !apiKey) {
      this.logger.error('As credenciais da API da Arquivei não estão configuradas no .env');
      throw new HttpException('Configuração de servidor incompleta.', 500);
    }

    const headers = {
      'X-API-ID': apiId,
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    };

    const params = {
      'cnpj[]': cnpj,
      'created_at[from]': startDate,
      'created_at[to]': endDate,
      limit: 50,
      format_type: 'json',
    };

    try {
      this.logger.log(`Buscando NFs para o CNPJ: ${cnpj} no período de ${startDate} a ${endDate}`);
      
      const response = await firstValueFrom(
        this.httpService.get(this.apiUrl, { headers, params, timeout: 20000 })
      );
      
      // The Arquivei API returns an object with a 'data' key containing the array of notes.
      // The frontend expects to receive the array directly.
      return response.data.data || [];

    } catch (error) {
      const status = error.response?.status || 500;
      const message = error.response?.data?.error?.message || error.message || 'Erro desconhecido';
      
      this.logger.error(`Erro ao buscar notas fiscais na Arquivei: Status ${status} - ${message}`);
      
      throw new HttpException(
        `Erro ao comunicar com a API da Arquivei: ${message}`,
        status,
      );
    }
  }
}
