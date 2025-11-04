import "dotenv/config";
import { Injectable } from "@nestjs/common";
import axios from "axios";
import https from "https";
import zlib from "zlib";
import fs from "fs";
import path from "path";
import { ElementCompact, xml2js } from "xml-js";
import { NotaFiscal } from "../types/nota-fiscal.interface";
import { UF_CODE_MAP } from "./uf-code-map";
import { SEFAZ_ENDPOINTS } from "./sefaz-endpoints";
import { PrismaClient } from "@prisma/client";
import * as XLSX from "xlsx";
import { Interval } from "@nestjs/schedule";

@Injectable()
export class SefazService {
  private nsuFile = "./nsu.txt";
  private prisma = new PrismaClient();

  /** 🔄 Consulta incremental (por NSU) */
  async consultarNotas({
    cnpj,
    password,
    state = "SP",
    tpAmb = "1",
    certificateFile,
  }: {
    cnpj: string;
    password: string;
    state: string;
    tpAmb: string;
    certificateFile: Express.Multer.File;
  }): Promise<{ notas?: NotaFiscal[]; logs: any }> {
    const logs: any = {};
    const cnpjNormalized = cnpj.replace(/\D/g, "");

    try {
      // ⚙️ UF e endpoint
      const ufSigla = Object.keys(UF_CODE_MAP).find(
        (key) => key === state || UF_CODE_MAP[key] === state
      );
      if (!ufSigla) throw new Error(`UF '${state}' não suportada.`);
      const cUFAutor = UF_CODE_MAP[ufSigla];
      const endpoint =
        tpAmb === "2" ? SEFAZ_ENDPOINTS.AN_HOM : SEFAZ_ENDPOINTS.AN;

      logs.endpoint = endpoint;
      logs.uf = ufSigla;
      logs.tpAmb = tpAmb;

      // 🧾 Último NSU
      let lastNSU = "000000000000000";
      if (fs.existsSync(this.nsuFile)) {
        lastNSU = fs.readFileSync(this.nsuFile, "utf8").trim();
      }

      const xmlBody = `
        <distDFeInt xmlns="http://www.portalfiscal.inf.br/nfe" versao="1.01">
          <tpAmb>${tpAmb}</tpAmb>
          <cUFAutor>${cUFAutor}</cUFAutor>
          <CNPJ>${cnpjNormalized}</CNPJ>
          <distNSU><ultNSU>${lastNSU}</ultNSU></distNSU>
        </distDFeInt>`;

      const soapEnvelope = `
        <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                         xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                         xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
          <soap12:Body>
            <nfeDistDFeInteresse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
              <nfeDadosMsg>${xmlBody}</nfeDadosMsg>
            </nfeDistDFeInteresse>
          </soap12:Body>
        </soap12:Envelope>`;

      // 🔒 HTTPS com certificado
      const httpsAgent = new https.Agent({
        pfx: certificateFile.buffer,
        passphrase: password,
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      });

      // 🚀 Consulta SEFAZ (ou modo simulado)
      let soapResponse: string;

      if (process.env.SEFAZ_MOCK === "true") {
        console.log("🧩 Modo simulação SEFAZ ativo — gerando XML mockado...");

        // Simula XML oficial SEFAZ (retDistDFeInt)
        soapResponse = `
          <soap:Envelope xmlns:soap="http://www.w3.org/2003/05/soap-envelope">
            <soap:Body>
              <nfeDistDFeInteresseResponse xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe">
                <nfeDistDFeInteresseResult>
                  <retDistDFeInt versao="1.01" xmlns="http://www.portalfiscal.inf.br/nfe">
                    <tpAmb>${tpAmb}</tpAmb>
                    <verAplic>SP_NFE_PL_009_V4</verAplic>
                    <cStat>138</cStat>
                    <xMotivo>Documentos localizados</xMotivo>
                    <dhResp>${new Date().toISOString()}</dhResp>
                    <ultNSU>000000000123456</ultNSU>
                    <maxNSU>000000000123457</maxNSU>
                    <loteDistDFeInt>
                      <docZip NSU="000000000123456" schema="procNFe_v4.00.xsd">
                        ${Buffer.from(
          zlib.gzipSync(`
    <nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
      <NFe>
        <infNFe Id="NFe35191111111111111111550010000012341000012345" versao="4.00">
          <ide>
            <cUF>35</cUF>
            <cNF>00012345</cNF>
            <natOp>VENDA DE MERCADORIAS</natOp>
            <mod>55</mod>
            <serie>1</serie>
            <nNF>12345</nNF>
            <dhEmi>2025-10-30T12:30:00-03:00</dhEmi>
            <tpNF>1</tpNF>
            <idDest>1</idDest>
            <cMunFG>3550308</cMunFG>
            <tpImp>1</tpImp>
            <tpEmis>1</tpEmis>
            <cDV>0</cDV>
            <tpAmb>1</tpAmb>
            <finNFe>1</finNFe>
            <indFinal>1</indFinal>
            <indPres>1</indPres>
            <procEmi>0</procEmi>
            <verProc>4.00</verProc>
          </ide>
          <emit>
            <CNPJ>12345678000100</CNPJ>
            <xNome>EMPRESA TESTE LTDA</xNome>
            <xFant>EMPRESA TESTE</xFant>
            <enderEmit>
              <xLgr>Rua Exemplo</xLgr>
              <nro>123</nro>
              <xBairro>Centro</xBairro>
              <cMun>3550308</cMun>
              <xMun>São Paulo</xMun>
              <UF>SP</UF>
              <CEP>01000000</CEP>
            </enderEmit>
            <IE>123456789</IE>
            <CRT>3</CRT>
          </emit>
          <dest>
            <CPF>98765432100</CPF>
            <xNome>CLIENTE A LTDA</xNome>
            <enderDest>
              <xLgr>Avenida Central</xLgr>
              <nro>999</nro>
              <xBairro>Centro</xBairro>
              <cMun>3304557</cMun>
              <xMun>Rio de Janeiro</xMun>
              <UF>RJ</UF>
              <CEP>20000000</CEP>
            </enderDest>
            <indIEDest>9</indIEDest>
          </dest>
          <det nItem="1">
            <prod>
              <cProd>ABC123</cProd>
              <xProd>Produto de Teste 1</xProd>
              <CFOP>5102</CFOP>
              <uCom>UN</uCom>
              <qCom>2.0000</qCom>
              <vUnCom>789.22</vUnCom>
              <vProd>1578.44</vProd>
            </prod>
          </det>
          <det nItem="2">
            <prod>
              <cProd>XYZ789</cProd>
              <xProd>Produto de Teste 3</xProd>
              <CFOP>5102</CFOP>
              <uCom>UN</uCom>
              <qCom>1.0000</qCom>
              <vUnCom>100.00</vUnCom>
              <vProd>100.00</vProd>
            </prod>
          </det>
          <total>
            <ICMSTot>
              <vBC>0.00</vBC>
              <vICMS>0.00</vICMS>
              <vICMSDeson>0.00</vICMSDeson>
              <vFCP>0.00</vFCP>
              <vProd>1678.44</vProd>
              <vNF>1678.44</vNF>
            </ICMSTot>
          </total>
          <transp>
            <modFrete>0</modFrete>
            <transporta>
              <xNome>TRANSPORTADORA MOCK</xNome>
              <CNPJ>55667788000122</CNPJ>
              <xEnder>Rua das Entregas 45</xEnder>
              <xMun>São Paulo</xMun>
              <UF>SP</UF>
            </transporta>
            <veicTransp>
              <placa>ABC1234</placa>
              <UF>SP</UF>
            </veicTransp>
          </transp>
        </infNFe>
      </NFe>
    </nfeProc>
  `)
        ).toString("base64")
          }
                      </docZip>
                    </loteDistDFeInt>
                  </retDistDFeInt>
                </nfeDistDFeInteresseResult>
              </nfeDistDFeInteresseResponse>
            </soap:Body>
          </soap:Envelope>
        `;
      } else {
        const response = await axios.post(endpoint, soapEnvelope, {
          httpsAgent,
          headers: {
            "Content-Type": "application/soap+xml; charset=utf-8",
            "SOAPAction":
              "http://www.portalfiscal.inf.br/nfe/wsdl/NFeDistribuicaoDFe/nfeDistDFeInteresse",
          },
          timeout: 40000,
          validateStatus: () => true,
        });
        soapResponse = response.data;
      }

      const xmlResponseMatch = soapResponse.match(/<retDistDFeInt.*<\/retDistDFeInt>/s);
      if (!xmlResponseMatch) {
        logs.soapError = "retDistDFeInt ausente na resposta SOAP.";
        // fallback → banco
        const notasBD = await this.buscarNotasDoBanco(cnpjNormalized, logs, "Sem resposta da SEFAZ");
        return { notas: notasBD, logs };
      }

      const xmlResponse = xmlResponseMatch[0];
      const parsed = xml2js(xmlResponse, { compact: true }) as ElementCompact;
      const ret = (parsed as any).retDistDFeInt;
      const cStat = ret.cStat?._text;
      const xMotivo = ret.xMotivo?._text;
      const ultNSU = ret.ultNSU?._text;
      const lote = ret.loteDistDFeInt;

      logs.cStat = cStat;
      logs.xMotivo = xMotivo;

      if (ultNSU) fs.writeFileSync(this.nsuFile, ultNSU);

      // Se não houver documentos ou erro → buscar no banco
      if (["138"].includes(cStat) === false) {
        const notasBD = await this.buscarNotasDoBanco(cnpjNormalized, logs, "Nenhum documento SEFAZ");
        return { notas: notasBD, logs };
      }

      // 📦 Processa retorno SEFAZ
      const notasFiscais: any[] = [];
      const pastaXml = path.resolve("./xmls");
      fs.mkdirSync(pastaXml, { recursive: true });

      const docs = Array.isArray(lote.docZip) ? lote.docZip : [lote.docZip];
      for (const doc of docs) {
        try {
          const xmlGzip = Buffer.from(doc._text, "base64");
          const xml = zlib.gunzipSync(xmlGzip).toString("utf8");

          // 💾 Salva o XML no disco
          const nomeArquivo = `nfe-${Date.now()}-${Math.floor(Math.random() * 10000)}.xml`;
          const caminhoArquivo = path.join(pastaXml, nomeArquivo);
          fs.writeFileSync(caminhoArquivo, xml);
          logs.xmlSalvo = logs.xmlSalvo || [];
          logs.xmlSalvo.push(caminhoArquivo);

          // 🧩 Converte XML → JSON estruturado
          const parsedXml = xml2js(xml, { compact: true }) as any;
          const nfeProc = parsedXml.nfeProc || parsedXml.NFe || parsedXml.resNFe;
          if (!nfeProc) continue;

          const infNFe = nfeProc.infNFe || nfeProc.NFe?.infNFe;
          if (!infNFe) continue;

          const ide = infNFe.ide || {};
          const emit = infNFe.emit || {};
          const dest = infNFe.dest || {};
          const total = infNFe.total?.ICMSTot || {};
          const produtos = Array.isArray(infNFe.det) ? infNFe.det : [infNFe.det];
          const numero = ide.nNF?._text || "";

          // Renomeia arquivo com número da nota
          if (numero) {
            const novoCaminho = path.join(pastaXml, `nfe-${numero}.xml`);
            fs.renameSync(caminhoArquivo, novoCaminho);
            logs.xmlSalvo[logs.xmlSalvo.length - 1] = novoCaminho;
          }

          // 🧾 Extrai todos os campos relevantes
          const notaCompleta = {
            numero,
            dataEmissao: ide.dhEmi?._text || "",
            cUF: ide.cUF?._text || "",
            cNF: ide.cNF?._text || "",
            natOp: ide.natOp?._text || "",
            mod: ide.mod?._text || "",
            serie: ide.serie?._text || "",
            tpNF: ide.tpNF?._text || "",
            idDest: ide.idDest?._text || "",
            cMunFG: ide.cMunFG?._text || "",
            tpImp: ide.tpImp?._text || "",
            tpEmis: ide.tpEmis?._text || "",
            cDV: ide.cDV?._text || "",
            tpAmb: ide.tpAmb?._text || "",
            finNFe: ide.finNFe?._text || "",
            indFinal: ide.indFinal?._text || "",
            indPres: ide.indPres?._text || "",
            procEmi: ide.procEmi?._text || "",
            verProc: ide.verProc?._text || "",

            // Emitente
            emitente: emit.xNome?._text || "",
            cnpjEmitente: emit.CNPJ?._text || "",
            nomeFantasia: emit.xFant?._text || "",
            ieEmitente: emit.IE?._text || "",
            crtEmitente: emit.CRT?._text || "",
            enderecoEmitente: [
              emit.enderEmit?.xLgr?._text,
              emit.enderEmit?.nro?._text,
              emit.enderEmit?.xBairro?._text,
              emit.enderEmit?.xMun?._text,
              emit.enderEmit?.UF?._text,
              emit.enderEmit?.CEP?._text,
            ]
              .filter(Boolean)
              .join(", "),

            // Destinatário
            destinatario: dest.xNome?._text || "",
            cpfDestinatario: dest.CPF?._text || dest.CNPJ?._text || "",
            indIEDest: dest.indIEDest?._text || "",
            enderecoDestinatario: [
              dest.enderDest?.xLgr?._text,
              dest.enderDest?.nro?._text,
              dest.enderDest?.xBairro?._text,
              dest.enderDest?.xMun?._text,
              dest.enderDest?.UF?._text,
              dest.enderDest?.CEP?._text,
            ]
              .filter(Boolean)
              .join(", "),

            // Totais
            valor: parseFloat(total.vNF?._text || "0"),
            vBC: parseFloat(total.vBC?._text || "0"),
            vICMS: parseFloat(total.vICMS?._text || "0"),
            vICMSDeson: parseFloat(total.vICMSDeson?._text || "0"),
            vFCP: parseFloat(total.vFCP?._text || "0"),
            vProd: parseFloat(total.vProd?._text || "0"),

            // Transporte
            modFrete: infNFe.transp?.modFrete?._text || "",
            transportadora: infNFe.transp?.transporta?.xNome?._text || "",
            cnpjTransportadora: infNFe.transp?.transporta?.CNPJ?._text || "",
            enderecoTransportadora: [
              infNFe.transp?.transporta?.xEnder?._text,
              infNFe.transp?.transporta?.xMun?._text,
              infNFe.transp?.transporta?.UF?._text,
            ]
              .filter(Boolean)
              .join(", "),
            placaVeiculo: infNFe.transp?.veicTransp?.placa?._text || "",
            ufVeiculo: infNFe.transp?.veicTransp?.UF?._text || "",

            // Produtos
            produtos: produtos
              .filter(Boolean)
              .map((p: any) => ({
                nItem: parseInt(p._attributes?.nItem || "0"),
                codigo: p.prod?.cProd?._text || "",
                descricao: p.prod?.xProd?._text || "",
                cfop: p.prod?.CFOP?._text || "",
                unidade: p.prod?.uCom?._text || "",
                quantidade: parseFloat(p.prod?.qCom?._text || "0"),
                valorUnitario: parseFloat(p.prod?.vUnCom?._text || "0"),
                valorTotal: parseFloat(p.prod?.vProd?._text || "0"),
              })),
          };

          notasFiscais.push(notaCompleta);
        } catch (zipErr) {
          logs.erroDescompactar = zipErr.message;
        }
      }

      // 💾 Salva no banco (atualiza se já existir)
      const log = await this.prisma.nfeLog.create({
        data: {
          cnpj: cnpjNormalized,
          cStat,
          xMotivo,
          ultNSU,
          tpAmb,
          xmlEnviado: xmlBody,
          soapRaw: soapResponse,
        },
      });

      for (const n of notasFiscais) {
        await this.prisma.nfeNota.upsert({
          where: { numero: n.numero },
          update: {
            ...n,
            logId: log.id,
            produtos: {
              deleteMany: {}, // remove produtos antigos da nota
              create: n.produtos,
            },
          },
          create: {
            ...n,
            logId: log.id,
            produtos: { create: n.produtos },
          },
        });
      }

      logs.totalNotas = notasFiscais.length;
      return { notas: notasFiscais, logs };
    } catch (err: any) {
      // fallback → banco
      const notasBD = await this.buscarNotasDoBanco(cnpjNormalized, logs, err.message);
      return { notas: notasBD, logs };
    }
  }

  /** 🧩 Busca notas do banco (para fallback) */
  private async buscarNotasDoBanco(cnpj: string, logs: any, motivo: string): Promise<NotaFiscal[]> {
    logs.fallback = motivo;
    const notasBDPrisma = await this.prisma.nfeNota.findMany({
      where: { log: { cnpj } },
      orderBy: { dataEmissao: "desc" },
    });
    return notasBDPrisma.map((n) => ({
      numero: n.numero ?? "",
      dataEmissao: n.dataEmissao ?? "",
      emitente: n.emitente ?? "",
      valor: n.valor ?? 0,
    }));
  }

  /** 📦 Consulta lote de NFes via XLSX */
  async consultarLotePorArquivo({
    arquivo,
    cnpj,
    password,
    state = "SP",
    tpAmb = "1",
    certificateFile,
  }: {
    arquivo: Express.Multer.File;
    cnpj: string;
    password: string;
    state?: string;
    tpAmb?: string;
    certificateFile: Express.Multer.File;
  }) {
    const logs: any = { processadas: 0, sucesso: 0, erro: 0 };
    try {
      const workbook = XLSX.read(arquivo.buffer, { type: "buffer" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      const chaves = linhas.flat().filter((v) => /^[0-9]{44}$/.test(String(v)));

      logs.totalChaves = chaves.length;
      const resultados: any[] = [];

      const httpsAgent = new https.Agent({
        pfx: certificateFile.buffer,
        passphrase: password,
        rejectUnauthorized: false,
        minVersion: "TLSv1.2",
      });

      const endpoint =
        tpAmb === "2"
          ? "https://hom.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx"
          : "https://www.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx";

      for (const chave of chaves) {
        logs.processadas++;
        try {
          const xmlBody = `
            <consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
              <tpAmb>${tpAmb}</tpAmb>
              <xServ>CONSULTAR</xServ>
              <chNFe>${chave}</chNFe>
            </consSitNFe>`;

          const soapEnvelope = `
            <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                             xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                             xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
              <soap12:Body>
                <nfeConsultaNF2 xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">
                  <nfeDadosMsg>${xmlBody}</nfeDadosMsg>
                </nfeConsultaNF2>
              </soap12:Body>
            </soap12:Envelope>`;

          const { data: soapResponse } = await axios.post(endpoint, soapEnvelope, {
            httpsAgent,
            headers: {
              "Content-Type": "application/soap+xml; charset=utf-8",
              "SOAPAction":
                "http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF2",
            },
            timeout: 40000,
            validateStatus: () => true,
          });

          const xmlMatch = soapResponse.match(/<retConsSitNFe.*<\/retConsSitNFe>/s);
          if (!xmlMatch) throw new Error("retConsSitNFe ausente");

          const parsed = xml2js(xmlMatch[0], { compact: true }) as any;
          const ret = parsed.retConsSitNFe;
          const cStat = ret.cStat?._text || "";
          const xMotivo = ret.xMotivo?._text || "";

          if (["100", "101", "135", "150"].includes(cStat)) {
            logs.sucesso++;
            const infProt = ret.protNFe?.infProt;
            const chNFe = infProt?.chNFe?._text;
            const dhRecbto = infProt?.dhRecbto?._text;

            let log = await this.prisma.nfeLog.findFirst({
              where: { cnpj },
              orderBy: { createdAt: "desc" },
            });

            if (!log) {
              log = await this.prisma.nfeLog.create({
                data: { cnpj, cStat, xMotivo, tpAmb },
              });
            }

            await this.prisma.nfeNota.upsert({
              where: { numero: chNFe },
              update: { dataEmissao: dhRecbto },
              create: {
                numero: chNFe,
                dataEmissao: dhRecbto,
                emitente: "Emitente não identificado",
                valor: 0,
                logId: log.id,
              },
            });

            resultados.push({ chave, cStat, xMotivo, dhRecbto });
          } else {
            logs.erro++;
            resultados.push({ chave, erro: xMotivo, cStat });
          }
        } catch (e: any) {
          logs.erro++;
          resultados.push({ chave, erro: e.message });
        }
      }

      return { logs, resultados };
    } catch (e: any) {
      logs.erroInterno = e.message;
      return { logs };
    }
  }


  /** 🔍 Consulta única de NF-e por chave (sem XLSX) */
async consultarPorChave({
  chave,
  cnpj,
  password,
  state = "SP",
  tpAmb = "1",
  certificateFile,
}: {
  chave: string;
  cnpj: string;
  password: string;
  state?: string;
  tpAmb?: string;
  certificateFile: Express.Multer.File;
}) {
  const logs: any = { chave };
  try {
    const https = require("https");
    const axios = require("axios");
    const { xml2js } = require("xml-js");

    const httpsAgent = new https.Agent({
      pfx: certificateFile.buffer,
      passphrase: password,
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    });

    const endpoint =
      tpAmb === "2"
        ? "https://hom.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx"
        : "https://www.nfe.fazenda.gov.br/NFeConsultaProtocolo4/NFeConsultaProtocolo4.asmx";

    const xmlBody = `
      <consSitNFe xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
        <tpAmb>${tpAmb}</tpAmb>
        <xServ>CONSULTAR</xServ>
        <chNFe>${chave}</chNFe>
      </consSitNFe>`;

    const soapEnvelope = `
      <soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                       xmlns:xsd="http://www.w3.org/2001/XMLSchema"
                       xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
        <soap12:Body>
          <nfeConsultaNF2 xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4">
            <nfeDadosMsg>${xmlBody}</nfeDadosMsg>
          </nfeConsultaNF2>
        </soap12:Body>
      </soap12:Envelope>`;

    const { data: soapResponse } = await axios.post(endpoint, soapEnvelope, {
      httpsAgent,
      headers: {
        "Content-Type": "application/soap+xml; charset=utf-8",
        "SOAPAction":
          "http://www.portalfiscal.inf.br/nfe/wsdl/NFeConsultaProtocolo4/nfeConsultaNF2",
      },
      timeout: 40000,
      validateStatus: () => true,
    });

    logs.soapResponse = soapResponse.slice(0, 500) + "...";

    const xmlMatch = soapResponse.match(/<retConsSitNFe.*<\/retConsSitNFe>/s);
    if (!xmlMatch) throw new Error("retConsSitNFe ausente no retorno da SEFAZ");

    const parsed = xml2js(xmlMatch[0], { compact: true });
    const ret = parsed.retConsSitNFe;

    const cStat = ret.cStat?._text || "";
    const xMotivo = ret.xMotivo?._text || "";
    const dhRecbto = ret.protNFe?.infProt?.dhRecbto?._text;
    const chNFe = ret.protNFe?.infProt?.chNFe?._text;

    // Salva o log
    const log = await this.prisma.nfeLog.create({
      data: { cnpj, cStat, xMotivo, tpAmb, xmlEnviado: xmlBody, soapRaw: soapResponse },
    });

    // Se a nota for autorizada, salva no banco
    if (["100", "101", "135", "150"].includes(cStat)) {
      await this.prisma.nfeNota.upsert({
        where: { numero: chNFe ?? chave },
        update: { dataEmissao: dhRecbto, logId: log.id },
        create: {
          numero: chNFe ?? chave,
          dataEmissao: dhRecbto,
          emitente: "Emitente não identificado",
          valor: 0,
          logId: log.id,
        },
      });
    }

    return { cStat, xMotivo, dhRecbto, logs };
  } catch (e: any) {
    logs.erro = e.message;
    return { erro: e.message, logs };
  }
}

  /** 🕒 Job automático a cada 1h10min */
  @Interval(70 * 60 * 1000)
  async executarConsultaAutomatica() {
    try {
      const cnpj = process.env.SEFAZ_CNPJ!;
      const password = process.env.SEFAZ_CERT_PASS!;
      const state = process.env.SEFAZ_STATE || "SP";
      const tpAmb = process.env.SEFAZ_TPAMB || "1";
      const certPath = path.resolve(process.env.SEFAZ_CERT_PATH!);

      if (!cnpj || !password || !certPath) {
        console.warn("⚠️ Variáveis SEFAZ não configuradas corretamente. Cron ignorado.");
        return;
      }

      const certificateFile = {
        buffer: fs.readFileSync(certPath),
      } as Express.Multer.File;

      const resultado = await this.consultarNotas({
        cnpj,
        password,
        state,
        tpAmb,
        certificateFile,
      });

      // 🚫 Ignorar execuções baseadas em fallback (banco)
      if (resultado.logs?.fallback) {
        console.log(
          `[${new Date().toISOString()}] ⚠️ Consulta ignorada — resultado veio do banco (${resultado.logs.fallback}).`
        );
        return;
      }

      // ✅ Somente processa se veio da SEFAZ
      console.log(`[${new Date().toISOString()}] ✅ Consulta automática concluída.`);
      console.log(`Notas encontradas na SEFAZ: ${resultado.notas?.length ?? 0}`);

      if (resultado.logs.xmlSalvo?.length) {
        console.log("📄 XMLs salvos em:");
        resultado.logs.xmlSalvo.forEach((c: string) => console.log("  •", c));
      } else {
        console.log("⚠️ Nenhum XML retornado pela SEFAZ (resumos apenas).");
      }
    } catch (e: any) {
      console.error(`[${new Date().toISOString()}] ❌ Erro no cron: ${e.message}`);
    }
  }
}
