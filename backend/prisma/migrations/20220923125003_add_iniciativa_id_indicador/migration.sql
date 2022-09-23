-- DropForeignKey
ALTER TABLE "indicador" DROP CONSTRAINT "indicador_meta_id_fkey";

-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "iniciativa_id" INTEGER,
ALTER COLUMN "meta_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indicador" ADD CONSTRAINT "indicador_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
