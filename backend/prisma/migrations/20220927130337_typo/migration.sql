/*
  Warnings:

  - You are about to drop the column `inciativa_id` on the `cronograma` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "cronograma" DROP CONSTRAINT "cronograma_inciativa_id_fkey";

-- AlterTable
ALTER TABLE "cronograma" DROP COLUMN "inciativa_id",
ADD COLUMN     "iniciativa_id" INTEGER;

-- AddForeignKey
ALTER TABLE "cronograma" ADD CONSTRAINT "cronograma_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
