/*
  Warnings:

  - You are about to drop the column `removido_em` on the `acompanhamento_tipo` table. All the data in the column will be lost.
  - You are about to drop the column `removido_por` on the `acompanhamento_tipo` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "acompanhamento_tipo" DROP CONSTRAINT "acompanhamento_tipo_removido_por_fkey";

-- AlterTable
ALTER TABLE "acompanhamento_tipo" DROP COLUMN "removido_em",
DROP COLUMN "removido_por";
