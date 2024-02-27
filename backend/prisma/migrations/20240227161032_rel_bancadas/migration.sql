/*
  Warnings:

  - You are about to drop the column `endereco` on the `parlamentar` table. All the data in the column will be lost.
  - You are about to drop the column `gabinete` on the `parlamentar` table. All the data in the column will be lost.
  - Added the required column `biografia` to the `ParlamentarMandato` table without a default value. This is not possible if the table is not empty.
  - Added the required column `gabinete` to the `ParlamentarMandato` table without a default value. This is not possible if the table is not empty.
  - Made the column `eleito` on table `ParlamentarMandato` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ParlamentarMandato" ADD COLUMN     "biografia" TEXT NOT NULL,
ADD COLUMN     "endereco" TEXT,
ADD COLUMN     "gabinete" TEXT NOT NULL,
ALTER COLUMN "eleito" SET NOT NULL;

-- AlterTable
ALTER TABLE "parlamentar" DROP COLUMN "endereco",
DROP COLUMN "gabinete";

-- CreateTable
CREATE TABLE "MandatoBancada" (
    "id" SERIAL NOT NULL,
    "mandato_id" INTEGER NOT NULL,
    "bancada_id" INTEGER NOT NULL,

    CONSTRAINT "MandatoBancada_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "MandatoBancada" ADD CONSTRAINT "MandatoBancada_mandato_id_fkey" FOREIGN KEY ("mandato_id") REFERENCES "ParlamentarMandato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MandatoBancada" ADD CONSTRAINT "MandatoBancada_bancada_id_fkey" FOREIGN KEY ("bancada_id") REFERENCES "bancada"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
