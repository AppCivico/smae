/*
  Warnings:

  - You are about to drop the column `privilegios_id` on the `perfil_privilegio` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[perfil_acesso_id,privilegio_id]` on the table `perfil_privilegio` will be added. If there are existing duplicate values, this will fail.
  - Made the column `codigo` on table `modulo` required. This step will fail if there are existing NULL values in that column.
  - Made the column `descricao` on table `modulo` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `privilegio_id` to the `perfil_privilegio` table without a default value. This is not possible if the table is not empty.
  - Made the column `pessoa_id` on table `pessoa_perfil` required. This step will fail if there are existing NULL values in that column.
  - Made the column `perfil_acesso_id` on table `pessoa_perfil` required. This step will fail if there are existing NULL values in that column.

*/
BEGIN;

-- DropForeignKey
ALTER TABLE "perfil_privilegio" DROP CONSTRAINT "perfil_privilegio_privilegios_id_fkey";

-- DropIndex
DROP INDEX "perfil_privilegio_perfil_acesso_id_privilegios_id_key";

-- AlterTable
ALTER TABLE "modulo" ALTER COLUMN "codigo" SET NOT NULL,
ALTER COLUMN "descricao" SET NOT NULL;

-- AlterTable
ALTER TABLE "perfil_privilegio" RENAME COLUMN "privilegios_id" TO "privilegio_id" ;

-- AlterTable
ALTER TABLE "pessoa" ALTER COLUMN "senha_atualizada_em" DROP NOT NULL,
ALTER COLUMN "senha_bloqueada_em" DROP NOT NULL;

-- AlterTable
ALTER TABLE "pessoa_perfil" ALTER COLUMN "pessoa_id" SET NOT NULL,
ALTER COLUMN "perfil_acesso_id" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "perfil_privilegio_perfil_acesso_id_privilegio_id_key" ON "perfil_privilegio"("perfil_acesso_id", "privilegio_id");

-- AddForeignKey
ALTER TABLE "perfil_privilegio" ADD CONSTRAINT "perfil_privilegio_privilegio_id_fkey" FOREIGN KEY ("privilegio_id") REFERENCES "privilegio"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT;
