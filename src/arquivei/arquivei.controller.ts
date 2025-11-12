import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ArquiveiService } from './arquivei.service';

@Controller('arquivei')
export class ArquiveiController {
  constructor(private readonly arquiveiService: ArquiveiService) {}

  @Get('notas-fiscais')
  async getNotasFiscais(
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
    return this.arquiveiService.fetchNotasFiscais(cnpj, startDate, endDate);
  }
}
