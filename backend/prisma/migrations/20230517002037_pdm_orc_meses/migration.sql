-- AlterTable
ALTER TABLE "meta_orcamento_config" ADD COLUMN     "execucao_disponivel_meses" INTEGER[] DEFAULT ARRAY[3, 6, 9, 12]::INTEGER[];

-- AlterTable
ALTER TABLE "portfolio" ADD COLUMN     "orcamento_execucao_disponivel_meses" INTEGER[] DEFAULT ARRAY[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]::INTEGER[];
