/*
  Warnings:

  - You are about to drop the column `cronograma_preenchido` on the `meta_status_consolidado_cf` table. All the data in the column will be lost.
  - You are about to drop the column `variaveis_aguardando_cp` on the `meta_status_consolidado_cf` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "meta_status_consolidado_cf" DROP COLUMN "cronograma_preenchido",
DROP COLUMN "variaveis_aguardando_cp",
ADD COLUMN     "cronograma_atraso_fim" INTEGER[],
ADD COLUMN     "cronograma_atraso_inicio" INTEGER[];
