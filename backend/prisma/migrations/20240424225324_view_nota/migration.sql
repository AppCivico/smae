-- DropIndex
DROP INDEX "nota_data_nota_status_idx";

-- DropIndex
DROP INDEX "nota_rever_em_idx";

-- AlterTable
ALTER TABLE "aviso_email" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- AlterTable
ALTER TABLE "nota" ALTER COLUMN "data_nota" SET DATA TYPE DATE,
ALTER COLUMN "rever_em" SET DATA TYPE DATE;

-- AlterTable
ALTER TABLE "nota_enderecamento" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- AlterTable
ALTER TABLE "nota_enderecamento_resposta" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- AlterTable
ALTER TABLE "nota_revisao" ADD COLUMN     "viewNotaComOrdemId" INTEGER;

-- CreateIndex
CREATE INDEX "nota_bloco_nota_id_idx" ON "nota"("bloco_nota_id");
