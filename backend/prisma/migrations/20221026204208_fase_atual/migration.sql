/*
  Warnings:

  - You are about to drop the column `ciclo_fase_atual` on the `ciclo_fisico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ciclo_fisico" DROP COLUMN "ciclo_fase_atual",
ADD COLUMN     "ciclo_fase_atual_id" INTEGER;

-- AddForeignKey
ALTER TABLE "ciclo_fisico" ADD CONSTRAINT "ciclo_fisico_ciclo_fase_atual_id_fkey" FOREIGN KEY ("ciclo_fase_atual_id") REFERENCES "ciclo_fisico_fase"("id") ON DELETE SET NULL ON UPDATE CASCADE;
