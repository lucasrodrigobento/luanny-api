-- CreateTable
CREATE TABLE "NfeLog" (
    "id" SERIAL NOT NULL,
    "cnpj" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cStat" TEXT,
    "xMotivo" TEXT,
    "ultNSU" TEXT,
    "tpAmb" TEXT,
    "xmlEnviado" TEXT,
    "soapRaw" TEXT,

    CONSTRAINT "NfeLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NfeNota" (
    "id" SERIAL NOT NULL,
    "numero" TEXT,
    "dataEmissao" TEXT,
    "emitente" TEXT,
    "valor" DOUBLE PRECISION,
    "logId" INTEGER NOT NULL,

    CONSTRAINT "NfeNota_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "NfeNota" ADD CONSTRAINT "NfeNota_logId_fkey" FOREIGN KEY ("logId") REFERENCES "NfeLog"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
