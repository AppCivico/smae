-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "variavel_mae_id" INTEGER;

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_variavel_mae_id_fkey" FOREIGN KEY ("variavel_mae_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;
