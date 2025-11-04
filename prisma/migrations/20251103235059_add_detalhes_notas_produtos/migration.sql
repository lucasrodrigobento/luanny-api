-- AlterTable
ALTER TABLE "NfeNota" ADD COLUMN     "cnpjEmitente" TEXT,
ADD COLUMN     "cpfDestinatario" TEXT,
ADD COLUMN     "destinatario" TEXT;

-- CreateTable
CREATE TABLE "NfeProduto" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT,
    "quantidade" DOUBLE PRECISION,
    "valorUnitario" DOUBLE PRECISION,
    "valorTotal" DOUBLE PRECISION,
    "notaId" INTEGER NOT NULL,

    CONSTRAINT "NfeProduto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NfeProduto" ADD CONSTRAINT "NfeProduto_notaId_fkey" FOREIGN KEY ("notaId") REFERENCES "NfeNota"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
