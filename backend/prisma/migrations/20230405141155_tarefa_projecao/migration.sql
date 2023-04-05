/*
  Warnings:

  - You are about to drop the column `projecao_atraso` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `projecao_inicio` on the `projeto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "projecao_atraso",
DROP COLUMN "projecao_inicio";

-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "projecao_atraso" INTEGER,
ADD COLUMN     "projecao_inicio" DATE,
ADD COLUMN     "projecao_termino" DATE;
