/*
  Warnings:

  - Added the required column `parlamentar_id` to the `ParlamentarAssessor` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ParlamentarAssessor" ADD COLUMN     "parlamentar_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "ParlamentarAssessor" ADD CONSTRAINT "ParlamentarAssessor_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
