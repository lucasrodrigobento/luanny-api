import { PrismaClient } from "./generated/prisma";

const prisma = new PrismaClient();

async function main() {
  const log = await prisma.nfeLog.create({
    data: {
      cnpj: "50614826000119",
      cStat: "138",
      xMotivo: "Documentos localizados com sucesso",
      ultNSU: "000000000000123",
      tpAmb: "1",
      xmlEnviado: "<distDFeInt>...</distDFeInt>",
      soapRaw: "<soap:Envelope>...</soap:Envelope>",
      notas: {
        create: [
          {
            numero: "12345",
            dataEmissao: "2025-11-03T14:00:00-03:00",
            emitente: "Empresa Exemplo LTDA",
            valor: 1523.45,
          },
          {
            numero: "12346",
            dataEmissao: "2025-11-03T15:30:00-03:00",
            emitente: "Fornecedor Teste ME",
            valor: 275.9,
          },
        ],
      },
    },
  });

  console.log("✅ Nota fake inserida com sucesso!");
  console.log(log);
}

main()
  .catch((e) => {
    console.error("Erro ao inserir:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
