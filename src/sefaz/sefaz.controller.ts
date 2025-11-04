import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFiles,
  Body,
  BadRequestException,
} from "@nestjs/common";
import { FileFieldsInterceptor } from "@nestjs/platform-express";
import { SefazService } from "./sefaz.service";

@Controller("sefaz")
export class SefazController {
  constructor(private readonly sefazService: SefazService) {}

  /** 🔄 Consulta incremental (via certificado A1) */
  @Post("consultar")
  @UseInterceptors(FileFieldsInterceptor([{ name: "certificate", maxCount: 1 }]))
  async consultar(
    @UploadedFiles() files: { certificate?: Express.Multer.File[] },
    @Body("cnpj") cnpj: string,
    @Body("password") password: string,
    @Body("state") state?: string,
    @Body("tpAmb") tpAmb?: string
  ) {
    const certificateFile = files.certificate?.[0];
    if (!certificateFile) {
      throw new BadRequestException("Certificado digital (.pfx) não enviado.");
    }

    return this.sefazService.consultarNotas({
      cnpj,
      password,
      state: state ?? "SP",
      tpAmb: tpAmb ?? "1",
      certificateFile,
    });
  }

  /** 📦 Consulta de NFes em lote (arquivo XLSX + certificado A1) */
  @Post("consultar/lote")
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: "arquivo", maxCount: 1 },
      { name: "certificate", maxCount: 1 },
    ])
  )
  async consultarLote(
    @UploadedFiles()
    files: {
      arquivo?: Express.Multer.File[];
      certificate?: Express.Multer.File[];
    },
    @Body("cnpj") cnpj: string,
    @Body("password") password: string,
    @Body("state") state?: string,
    @Body("tpAmb") tpAmb?: string
  ) {
    const arquivo = files.arquivo?.[0];
    const certificateFile = files.certificate?.[0];

    if (!arquivo) {
      throw new BadRequestException("Arquivo XLSX não enviado.");
    }
    if (!certificateFile) {
      throw new BadRequestException("Certificado digital (.pfx) não enviado.");
    }

    return this.sefazService.consultarLotePorArquivo({
      arquivo,
      cnpj,
      password,
      state: state ?? "SP",
      tpAmb: tpAmb ?? "1",
      certificateFile,
    });
  }

  /** 🔑 Consulta direta por chave única (sem XLSX) */
  @Post("consultar-chave")
  @UseInterceptors(FileFieldsInterceptor([{ name: "certificate", maxCount: 1 }]))
  async consultarChave(
    @UploadedFiles() files: { certificate?: Express.Multer.File[] },
    @Body("chave") chave: string,
    @Body("cnpj") cnpj: string,
    @Body("password") password: string,
    @Body("state") state?: string,
    @Body("tpAmb") tpAmb?: string
  ) {
    const certificateFile = files.certificate?.[0];
    if (!certificateFile)
      throw new BadRequestException("Certificado digital (.pfx) não enviado.");
    if (!chave || !/^[0-9]{44}$/.test(chave))
      throw new BadRequestException("Chave de NF-e inválida (precisa ter 44 dígitos).");

    return this.sefazService.consultarPorChave({
      chave,
      cnpj,
      password,
      state: state ?? "SP",
      tpAmb: tpAmb ?? "1",
      certificateFile,
    });
  }
}
