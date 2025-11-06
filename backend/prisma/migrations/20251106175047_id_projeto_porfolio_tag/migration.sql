/*
  Warnings:

  - The primary key for the `projeto_portfolio_tag` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "projeto_portfolio_tag" DROP CONSTRAINT "projeto_portfolio_tag_pkey",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "projeto_portfolio_tag_pkey" PRIMARY KEY ("id");
