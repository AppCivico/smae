/*
  Warnings:

  - You are about to drop the column `atualizado_em` on the `projeto_pessoa_revisao` table. All the data in the column will be lost.
  - You are about to drop the column `projeto_revisado` on the `projeto_pessoa_revisao` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto_pessoa_revisao" DROP COLUMN "atualizado_em",
DROP COLUMN "projeto_revisado",
ADD COLUMN     "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
