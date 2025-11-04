/*
  Warnings:

  - A unique constraint covering the columns `[numero]` on the table `NfeNota` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "NfeNota_numero_key" ON "NfeNota"("numero");
