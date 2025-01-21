-- AlterTable
ALTER TABLE "pessoa" ADD COLUMN     "equipe_pdm_tipos" "TipoPdm"[] DEFAULT ARRAY[]::"TipoPdm"[];
