/*
  Warnings:

  - You are about to drop the column `prazo` on the `etapa` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "etapa" DROP COLUMN "prazo",
ADD COLUMN     "prazo_inicio" TIMESTAMP(3),
ADD COLUMN     "prazo_termino" TIMESTAMP(3);
