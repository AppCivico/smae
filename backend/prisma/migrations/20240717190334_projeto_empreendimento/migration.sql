-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "empreendimento_id" INTEGER;

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_empreendimento_id_fkey" FOREIGN KEY ("empreendimento_id") REFERENCES "empreendimento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
