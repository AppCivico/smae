/*
  Warnings:

  - A unique constraint covering the columns `[pessoa_id]` on the table `pessoa_acesso_pdm` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "variavel_responsavel" RENAME CONSTRAINT "VariavelResponsavel_pkey" TO "variavel_responsavel_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "pessoa_acesso_pdm_pessoa_id_key" ON "pessoa_acesso_pdm"("pessoa_id");

-- RenameForeignKey
ALTER TABLE "variavel_responsavel" RENAME CONSTRAINT "VariavelResponsavel_pessoa_id_fkey" TO "variavel_responsavel_pessoa_id_fkey";

-- RenameForeignKey
ALTER TABLE "variavel_responsavel" RENAME CONSTRAINT "VariavelResponsavel_variavel_id_fkey" TO "variavel_responsavel_variavel_id_fkey";
