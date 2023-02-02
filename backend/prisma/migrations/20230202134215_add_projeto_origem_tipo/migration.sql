/*
  Warnings:

  - Added the required column `origem_tipo` to the `projeto` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ProjetoOrigemTipo" AS ENUM ('PdmSistema', 'PdmAntigo', 'Outro');

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "origem_tipo" "ProjetoOrigemTipo" NOT NULL;
