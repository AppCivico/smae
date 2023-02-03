/*
  Warnings:

  - You are about to drop the column `descricao` on the `projeto` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "descricao",
ADD COLUMN     "data_revisao" DATE;
