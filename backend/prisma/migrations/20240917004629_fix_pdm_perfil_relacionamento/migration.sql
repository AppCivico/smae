-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "PdmPerfilRelacionamento" ADD VALUE 'INICIATIVA';
ALTER TYPE "PdmPerfilRelacionamento" ADD VALUE 'ATIVIDADE';

-- AlterTable
ALTER TABLE "pdm_perfil" ADD COLUMN     "atividade_id" INTEGER,
ADD COLUMN     "iniciativa_id" INTEGER;

-- AddForeignKey
ALTER TABLE "pdm_perfil" ADD CONSTRAINT "pdm_perfil_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pdm_perfil" ADD CONSTRAINT "pdm_perfil_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
