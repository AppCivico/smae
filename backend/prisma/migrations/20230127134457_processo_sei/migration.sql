/*
  Warnings:

  - You are about to drop the column `aprovacao_processo_sei` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `aprovacao_registro_sei_errmsg` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `aprovacao_registro_sei_info` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `encerramento_processo_sei` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `encerramento_registro_sei_errmsg` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `encerramento_registro_sei_info` on the `projeto` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CategoriaProcessoSei" AS ENUM ('Encerramento', 'Aprovacao', 'Manual');

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "aprovacao_processo_sei",
DROP COLUMN "aprovacao_registro_sei_errmsg",
DROP COLUMN "aprovacao_registro_sei_info",
DROP COLUMN "encerramento_processo_sei",
DROP COLUMN "encerramento_registro_sei_errmsg",
DROP COLUMN "encerramento_registro_sei_info";

-- CreateTable
CREATE TABLE "ProjetoRegistroSei" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "categoria" "CategoriaProcessoSei" NOT NULL,
    "processo_sei" TEXT NOT NULL,
    "registro_sei_info" JSONB NOT NULL,
    "registro_sei_errmsg" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "criado_por" INTEGER NOT NULL,

    CONSTRAINT "ProjetoRegistroSei_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjetoRegistroSei" ADD CONSTRAINT "ProjetoRegistroSei_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
