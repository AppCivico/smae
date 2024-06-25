-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "colaboradores_no_orgao" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
ADD COLUMN     "orgao_colaborador_id" INTEGER,
ADD COLUMN     "secretario_colaborador" TEXT;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_orgao_colaborador_id_fkey" FOREIGN KEY ("orgao_colaborador_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
