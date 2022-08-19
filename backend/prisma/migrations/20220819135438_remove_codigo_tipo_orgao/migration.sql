/*
  Warnings:

  - You are about to drop the column `perfis_acesso_id` on the `pessoa_perfil` table. All the data in the column will be lost.
  - You are about to drop the column `codigo` on the `tipo_orgao` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "pessoa_perfil" DROP CONSTRAINT "pessoa_perfil_perfis_acesso_id_fkey";

-- AlterTable
ALTER TABLE "pessoa_perfil" DROP COLUMN "perfis_acesso_id",
ADD COLUMN     "perfil_acesso_id" INTEGER;

-- AlterTable
ALTER TABLE "tipo_orgao" DROP COLUMN "codigo";

-- AddForeignKey
ALTER TABLE "pessoa_perfil" ADD CONSTRAINT "pessoa_perfil_perfil_acesso_id_fkey" FOREIGN KEY ("perfil_acesso_id") REFERENCES "perfil_acesso"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;
