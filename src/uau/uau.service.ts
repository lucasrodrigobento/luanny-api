import { Injectable, HttpException } from "@nestjs/common";
import axios from "axios";

@Injectable()
export class UauService {
  private readonly baseUrlAuth = process.env.UAU_BASE_AUTH!;
  private readonly baseUrlProcesso = process.env.UAU_BASE_PROCESSO!;

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
        `${this.baseUrlAuth}/AutenticarUsuario`,
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
        `${this.baseUrlProcesso}/ConsultarProcessos`,
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

      return data;
    } catch (err: any) {
      throw new HttpException(
        `Erro ao consultar processos UAU: ${err.message}`,
        err.response?.status || 500
      );
    }
  }
}
