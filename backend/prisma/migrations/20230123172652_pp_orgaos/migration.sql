/*
  Warnings:

  - The values [Priorizado] on the enum `ProjetoStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `aprovado_em` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `aprovado_por` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `diretorio_id` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `priorizado_em` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `priorizado_por` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `responsavel` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the `Diretorio` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `projeto_orgao` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `orgao_gestor_id` to the `projeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `portifolio_id` to the `projeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrado_em` to the `projeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `registrado_por` to the `projeto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjetoStatus_new" AS ENUM ('Registrado', 'Selecionado', 'EmPlanejamento', 'Planejado', 'Validado', 'EmAcompanhamento', 'Suspenso', 'Fechado');
ALTER TABLE "projeto" ALTER COLUMN "status" TYPE "ProjetoStatus_new" USING ("status"::text::"ProjetoStatus_new");
ALTER TYPE "ProjetoStatus" RENAME TO "ProjetoStatus_old";
ALTER TYPE "ProjetoStatus_new" RENAME TO "ProjetoStatus";
DROP TYPE "ProjetoStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_diretorio_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_orgao" DROP CONSTRAINT "projeto_orgao_orgao_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_orgao" DROP CONSTRAINT "projeto_orgao_projeto_id_fkey";

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "aprovado_em",
DROP COLUMN "aprovado_por",
DROP COLUMN "diretorio_id",
DROP COLUMN "priorizado_em",
DROP COLUMN "priorizado_por",
DROP COLUMN "responsavel",
ADD COLUMN     "em_planejamento_em" TIMESTAMP(3),
ADD COLUMN     "em_planejamento_por" INTEGER,
ADD COLUMN     "orgao_gestor_id" INTEGER NOT NULL,
ADD COLUMN     "orgao_responsavel_id" INTEGER,
ADD COLUMN     "orgaos_participantes" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "portifolio_id" INTEGER NOT NULL,
ADD COLUMN     "registrado_em" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "registrado_por" INTEGER NOT NULL,
ADD COLUMN     "responsaveis_no_orgao_gestor" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "responsavel_id" INTEGER,
ADD COLUMN     "selecionado_em" TIMESTAMP(3),
ADD COLUMN     "selecionado_por" INTEGER;

-- DropTable
DROP TABLE "Diretorio";

-- DropTable
DROP TABLE "projeto_orgao";

-- CreateTable
CREATE TABLE "portifolio" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,

    CONSTRAINT "portifolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "portifolio_orgao" (
    "id" SERIAL NOT NULL,
    "portifolio_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,

    CONSTRAINT "portifolio_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "portifolio_titulo_key" ON "portifolio"("titulo");

-- AddForeignKey
ALTER TABLE "portifolio_orgao" ADD CONSTRAINT "portifolio_orgao_portifolio_id_fkey" FOREIGN KEY ("portifolio_id") REFERENCES "portifolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "portifolio_orgao" ADD CONSTRAINT "portifolio_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_portifolio_id_fkey" FOREIGN KEY ("portifolio_id") REFERENCES "portifolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_orgao_responsavel_id_fkey" FOREIGN KEY ("orgao_responsavel_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_registrado_por_fkey" FOREIGN KEY ("registrado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_selecionado_por_fkey" FOREIGN KEY ("selecionado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_em_planejamento_por_fkey" FOREIGN KEY ("em_planejamento_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_arquivado_por_fkey" FOREIGN KEY ("arquivado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
