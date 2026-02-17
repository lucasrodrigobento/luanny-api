import { Injectable, HttpException, Logger } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class UauService {
  private readonly logger = new Logger(UauService.name);
  private readonly baseUrlAuth = process.env.UAU_BASE_AUTH!;
  private readonly baseUrlProcesso = process.env.UAU_BASE_PROCESSO!;
  private readonly baseUrlGerarNF = process.env.UAU_BASE_GERAR_NF!;
  private readonly empresaAlvo = (process.env.UAU_EMPRESA || 'VEGA').toUpperCase();

  /** 🔐 1️⃣ Gera o authToken a partir das credenciais fixas do .env */
  async autenticarUsuario(): Promise<string> {
    try {
      const integrationToken = process.env.UAU_INTEGRATION_TOKEN!;
      const payload = {
        login: process.env.UAU_LOGIN!,
        senha: process.env.UAU_SENHA!,
        UsuarioUAUSite: process.env.UAU_SITE!,
      };

      const { data } = await axios.post(
        this.baseUrlAuth,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-INTEGRATION-Authorization": integrationToken,
          },
          timeout: 20000,
        }
      );

      const token = data.Authorization || data.token || data;
      if (!token) throw new Error("Token de autenticação não retornado pela API UAU.");

      return token;
    } catch (err: any) {
      throw new HttpException(
        `Erro ao autenticar usuário UAU: ${err.message}`,
        err.response?.status || 500
      );
    }
  }

  /** 🔍 2️⃣ Consulta processos com parâmetros recebidos no body */
  async consultarProcessos({
    empresa,
    obra,
    periodoInicial,
    periodoFinal,
  }: {
    empresa: number;
    obra: string;
    periodoInicial: string;
    periodoFinal: string;
  }): Promise<any> {
    try {
      const integrationToken = process.env.UAU_INTEGRATION_TOKEN!;
      const authToken = await this.autenticarUsuario();

      const payload = {
        EmpresaObraPeriodo: {
          EmpresaObra: [{ Empresa: empresa, Obra: obra }],
          PeriodoInicial: periodoInicial,
          PeriodoFinal: periodoFinal,
        },
      };

      const { data } = await axios.post(
        this.baseUrlProcesso,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-INTEGRATION-Authorization": integrationToken,
            Authorization: authToken,
          },
          timeout: 30000,
        }
      );

      // ❗ Importante: não filtrar aqui para manter o mesmo comportamento do Postman
      // Se precisar filtrar por Status/DataPagamento, fazemos isso no front.
      return data;
    } catch (err: any) {
      throw new HttpException(
        `Erro ao consultar processos UAU: ${err.message}`,
        err.response?.status || 500
      );
    }
  }

  /** 📄 Lista modelos de NF conforme empresa configurada
   *  Observação: o UAU atualmente espera o CÓDIGO INTERNO do modelo (código da linha),
   *  não o código fiscal da nota ("55", "3", etc.).
   *  Por isso, "codigo" abaixo é o identificador interno usado em ModeloNF.ModeloNF.
   */
  getModelosNF(): Array<{ codigo: number; descricao: string }> {
    // Base compartilhada: códigos internos da tabela de modelos (ex.: 1,2,3...),
    // descrição exibindo também o código fiscal da NF.
    // LOCALIZA
    const modelosLocaliza = [
      { codigo: 1, descricao: '1 - NOTA FISCAL' },                                 // Código=1, Código modelo N.F.=1
      { codigo: 2, descricao: '55 - NOTA FISCAL ELETRÔNICA' },                     // Código=2, Código modelo N.F.=55
      { codigo: 3, descricao: '1-A - NOTA FISCAL' },                               // Código=3, Código modelo N.F.=1-A
      { codigo: 4, descricao: '2 - NOTA FISCAL DE VENDA A CONSUMIDOR' },           // Código=4, Código modelo N.F.=2
      { codigo: 5, descricao: 'NF-e - NOTA FISCAL ELETRÔNICA' },                   // Código=5, Código modelo N.F.=NF-e
      { codigo: 6, descricao: '65 - NOTA FISCAL DE CONSUMIDOR ELETRÔNICA' },       // Código=6, Código modelo N.F.=65
      { codigo: 7, descricao: '6 - NOTA FISCAL/CONTA ENERGIA ELETRICA' },          // Código=7, Código modelo N.F.=6
      { codigo: 8, descricao: '57 - CT - TRANSPORTE' },                            // Código=8, Código modelo N.F.=57
      { codigo: 9, descricao: '9 - NOTA FISCAL DE FATURA' },                       // Código=9, Código modelo N.F.=9
      { codigo: 10, descricao: '3 - NOTA FISCAL ELETRÔNICA DE SERVIÇO' },          // Código=10, Código modelo N.F.=3
      { codigo: 11, descricao: '11 - DARF' },                                      // Código=11, Código modelo N.F.=11
    ];

    // VEGA: por enquanto o UAU está utilizando os mesmos códigos internos da LOCALIZA
    // para o campo ModeloNF, então reaproveitamos a mesma base.
    if (this.empresaAlvo === 'LOCALIZA') {
      return modelosLocaliza;
    }
    // Default (VEGA e demais): mesma codificação interna usada pelo UAU
    return modelosLocaliza;
  }

  /** 🧾 3️⃣ Gerar nova Nota Fiscal vinculada a um processo */
  async gerarNotaFiscal(payload: any): Promise<any> {
    try {
      const integrationToken = process.env.UAU_INTEGRATION_TOKEN!;
      const authToken = await this.autenticarUsuario();

      this.logger.debug(`Gerar NF - payload enviado ao UAU: ${JSON.stringify(payload)}`);

      const { data } = await axios.post(
        this.baseUrlGerarNF,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
            "X-INTEGRATION-Authorization": integrationToken,
            Authorization: authToken,
          },
          timeout: 30000,
        }
      );

      this.logger.debug(`Gerar NF - resposta do UAU: ${JSON.stringify(data)}`);

      return data;
    } catch (err: any) {
      const status = err.response?.status || 500;
      const responseData = err.response?.data;

      this.logger.error(
        `Erro ao gerar NF no UAU - status ${status} - mensagem: ${err.message} - retorno: ${JSON.stringify(responseData)}`,
      );

      const detalhe =
        responseData?.Mensagem ||
        responseData?.Descricao ||
        responseData?.Detalhe ||
        err.message;

      throw new HttpException(
        `Erro ao gerar Nota Fiscal no UAU: ${detalhe}`,
        status,
      );
    }
  }
}
