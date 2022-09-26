/*
  Warnings:

  - Made the column `pdm_id` on table `tag` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "tag" DROP CONSTRAINT "tag_pdm_id_fkey";

-- AlterTable
ALTER TABLE "tag" ALTER COLUMN "pdm_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "tag" ADD CONSTRAINT "tag_pdm_id_fkey" FOREIGN KEY ("pdm_id") REFERENCES "pdm"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
