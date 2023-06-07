/*
  Warnings:

  - You are about to drop the column `pauta` on the `projeto_acompanhamento_item` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto_acompanhamento" ADD COLUMN     "pauta" TEXT;

-- AlterTable
ALTER TABLE "projeto_acompanhamento_item" DROP COLUMN "pauta";
