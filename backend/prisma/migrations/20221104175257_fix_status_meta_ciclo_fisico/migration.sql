/*
  Warnings:

  - You are about to drop the column `status` on the `status_meta_ciclo_fisico` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "status_meta_ciclo_fisico" DROP COLUMN "status",
ADD COLUMN     "status_coleta" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status_cronograma" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status_valido" BOOLEAN NOT NULL DEFAULT false;
