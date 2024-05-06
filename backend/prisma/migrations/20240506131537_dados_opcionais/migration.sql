/*
  Warnings:

  - You are about to drop the column `critico` on the `transferencia` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "transferencia" DROP COLUMN "critico",
ALTER COLUMN "interface" DROP NOT NULL,
ALTER COLUMN "clausula_suspensiva" DROP NOT NULL;
