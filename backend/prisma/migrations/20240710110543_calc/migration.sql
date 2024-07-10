-- AlterTable
ALTER TABLE "formula_composta" ADD COLUMN     "variavel_calc_id" INTEGER;

-- AlterTable
ALTER TABLE "projeto" ALTER COLUMN "vetores_busca" DROP DEFAULT;

-- AlterTable
ALTER TABLE "variavel" ALTER COLUMN "vetores_busca" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_variavel_calc_id_fkey" FOREIGN KEY ("variavel_calc_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
