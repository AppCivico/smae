/*
  Warnings:

  - Added the required column `cronograma_id` to the `etapa` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "etapa" ADD COLUMN     "cronograma_id" INTEGER NOT NULL,
ADD COLUMN     "titulo" TEXT;

-- AddForeignKey
ALTER TABLE "etapa" ADD CONSTRAINT "etapa_cronograma_id_fkey" FOREIGN KEY ("cronograma_id") REFERENCES "cronograma"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
