/*
  Warnings:

  - You are about to drop the column `biografia` on the `ParlamentarMandato` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ParlamentarMandato" DROP COLUMN "biografia";

-- AlterTable
ALTER TABLE "parlamentar" ADD COLUMN     "biografia" TEXT;
