-- AlterTable
ALTER TABLE "formula_composta" ADD COLUMN     "variavel_mae_id" INTEGER;

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_variavel_mae_id_fkey" FOREIGN KEY ("variavel_mae_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
