/*
  Warnings:

  - Made the column `numero` on table `NfeNota` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "NfeNota" ALTER COLUMN "numero" SET NOT NULL;
