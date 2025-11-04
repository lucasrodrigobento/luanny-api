-- AlterTable
ALTER TABLE "NfeNota" ADD COLUMN     "cnpjTransportadora" TEXT,
ADD COLUMN     "enderecoDestinatario" TEXT,
ADD COLUMN     "enderecoEmitente" TEXT,
ADD COLUMN     "modFrete" TEXT,
ADD COLUMN     "natOp" TEXT,
ADD COLUMN     "placaVeiculo" TEXT,
ADD COLUMN     "transportadora" TEXT,
ADD COLUMN     "ufVeiculo" TEXT;

-- AlterTable
ALTER TABLE "NfeProduto" ADD COLUMN     "cfop" TEXT,
ADD COLUMN     "unidade" TEXT;
