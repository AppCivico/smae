/*
  Warnings:

  - You are about to drop the column `projeto_id` on the `equipamento` table. All the data in the column will be lost.
  - You are about to drop the column `projeto_id` on the `grupo_tematico` table. All the data in the column will be lost.
  - You are about to drop the column `projeto_id` on the `tipo_intervencao` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "equipamento" DROP CONSTRAINT "equipamento_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "grupo_tematico" DROP CONSTRAINT "grupo_tematico_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "tipo_intervencao" DROP CONSTRAINT "tipo_intervencao_projeto_id_fkey";

-- AlterTable
ALTER TABLE "equipamento" DROP COLUMN "projeto_id";

-- AlterTable
ALTER TABLE "grupo_tematico" DROP COLUMN "projeto_id";

-- AlterTable
ALTER TABLE "tipo_intervencao" DROP COLUMN "projeto_id";

-- CreateTable
CREATE TABLE "projeto_equipamento" (
    "projeto_id" INTEGER NOT NULL,
    "equipamento_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "projeto_tipo_intervencao" (
    "projeto_id" INTEGER NOT NULL,
    "tipo_intervencao_id" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "projeto_grupo_tematico" (
    "projeto_id" INTEGER NOT NULL,
    "grupo_tematico_id" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "projeto_equipamento_projeto_id_equipamento_id_key" ON "projeto_equipamento"("projeto_id", "equipamento_id");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_tipo_intervencao_projeto_id_tipo_intervencao_id_key" ON "projeto_tipo_intervencao"("projeto_id", "tipo_intervencao_id");

-- CreateIndex
CREATE UNIQUE INDEX "projeto_grupo_tematico_projeto_id_grupo_tematico_id_key" ON "projeto_grupo_tematico"("projeto_id", "grupo_tematico_id");

-- AddForeignKey
ALTER TABLE "projeto_equipamento" ADD CONSTRAINT "projeto_equipamento_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_equipamento" ADD CONSTRAINT "projeto_equipamento_equipamento_id_fkey" FOREIGN KEY ("equipamento_id") REFERENCES "equipamento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_tipo_intervencao" ADD CONSTRAINT "projeto_tipo_intervencao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_tipo_intervencao" ADD CONSTRAINT "projeto_tipo_intervencao_tipo_intervencao_id_fkey" FOREIGN KEY ("tipo_intervencao_id") REFERENCES "tipo_intervencao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_grupo_tematico" ADD CONSTRAINT "projeto_grupo_tematico_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_grupo_tematico" ADD CONSTRAINT "projeto_grupo_tematico_grupo_tematico_id_fkey" FOREIGN KEY ("grupo_tematico_id") REFERENCES "grupo_tematico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
