-- AlterTable
ALTER TABLE "orgao" ADD COLUMN     "cnpj" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "nivel" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "oficial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "parente_id" INTEGER,
ADD COLUMN     "secretario_responsavel" TEXT;

-- AddForeignKey
ALTER TABLE "orgao" ADD CONSTRAINT "orgao_parente_id_fkey" FOREIGN KEY ("parente_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
