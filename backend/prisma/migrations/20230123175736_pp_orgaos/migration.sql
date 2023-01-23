/*
  Warnings:

  - You are about to drop the column `portifolio_id` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `fonte_recurso_id` on the `projeto_fonte_recurso` table. All the data in the column will be lost.
  - You are about to drop the `portifolio` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `portfolio_id` to the `projeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fonte_recurso_ano` to the `projeto_fonte_recurso` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fonte_recurso_cod_sof` to the `projeto_fonte_recurso` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "portifolio_orgao" DROP CONSTRAINT "portifolio_orgao_portifolio_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_portifolio_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_fonte_recurso" DROP CONSTRAINT "projeto_fonte_recurso_fonte_recurso_id_fkey";

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "portifolio_id",
ADD COLUMN     "portfolio_id" INTEGER NOT NULL,
ALTER COLUMN "versao" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "projeto_fonte_recurso" DROP COLUMN "fonte_recurso_id",
ADD COLUMN     "fonte_recurso_ano" INTEGER NOT NULL,
ADD COLUMN     "fonte_recurso_cod_sof" TEXT NOT NULL;

-- DropTable
DROP TABLE "portifolio";

-- CreateTable
CREATE TABLE "Portfolio" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,

    CONSTRAINT "Portfolio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Portfolio_titulo_key" ON "Portfolio"("titulo");

-- AddForeignKey
ALTER TABLE "portifolio_orgao" ADD CONSTRAINT "portifolio_orgao_portifolio_id_fkey" FOREIGN KEY ("portifolio_id") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "Portfolio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
