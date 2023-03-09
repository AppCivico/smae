/*
  Warnings:

  - Changed the type of `codigo` on the `projeto_risco` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "projeto_risco" DROP COLUMN "codigo",
ADD COLUMN     "codigo" INTEGER NOT NULL;
