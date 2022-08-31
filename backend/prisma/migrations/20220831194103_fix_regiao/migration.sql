-- DropForeignKey
ALTER TABLE "regiao" DROP CONSTRAINT "regiao_parente_id_fkey";

-- AlterTable
ALTER TABLE "regiao" ALTER COLUMN "parente_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "regiao" ADD CONSTRAINT "regiao_parente_id_fkey" FOREIGN KEY ("parente_id") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;
