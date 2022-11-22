/*
  Warnings:

  - Added the required column `pdm_id` to the `painel` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "painel" ADD COLUMN "pdm_id" INTEGER;

UPDATE "painel" SET pdm_id = ( SELECT id FROM pdm WHERE ativo = true );

ALTER TABLE "painel" ALTER COLUMN "pdm_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "painel" ADD CONSTRAINT "painel_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
