/*
  Warnings:

  - You are about to drop the column `pessoa_id` on the `pdm_perfil` table. All the data in the column will be lost.
  - Added the required column `equipe_id` to the `pdm_perfil` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "pdm_perfil" DROP CONSTRAINT "pdm_perfil_pessoa_id_fkey";

-- AlterTable
ALTER TABLE "pdm_perfil" DROP COLUMN "pessoa_id",
ADD COLUMN     "equipe_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "pdm_perfil" ADD CONSTRAINT "pdm_perfil_equipe_id_fkey" FOREIGN KEY ("equipe_id") REFERENCES "grupo_responsavel_equipe"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
