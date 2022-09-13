/*
  Warnings:

  - You are about to drop the column `temaId` on the `meta_orgao` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "meta_orgao" DROP CONSTRAINT "meta_orgao_temaId_fkey";

-- AlterTable
ALTER TABLE "meta_orgao" DROP COLUMN "temaId";
