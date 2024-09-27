-- CreateEnum
CREATE TYPE "CompromissoOrigemRelacionamento" AS ENUM ('Projeto', 'Meta', 'Iniciativa', 'Atividade');

-- DropForeignKey
ALTER TABLE "projeto_origem" DROP CONSTRAINT "projeto_origem_projeto_id_fkey";

-- AlterTable
ALTER TABLE "projeto_origem" ADD COLUMN     "iniciativaId" INTEGER,
ADD COLUMN     "rel_atividade_id" INTEGER,
ADD COLUMN     "rel_iniciativa_id" INTEGER,
ADD COLUMN     "rel_meta_id" INTEGER,
ADD COLUMN     "relacionamento" "CompromissoOrigemRelacionamento" NOT NULL DEFAULT 'Projeto',
ALTER COLUMN "projeto_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_rel_meta_id_fkey" FOREIGN KEY ("rel_meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_rel_atividade_id_fkey" FOREIGN KEY ("rel_atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_rel_iniciativa_id_fkey" FOREIGN KEY ("rel_iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_origem" ADD CONSTRAINT "projeto_origem_iniciativaId_fkey" FOREIGN KEY ("iniciativaId") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
