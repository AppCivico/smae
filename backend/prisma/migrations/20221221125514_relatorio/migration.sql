-- AlterTable
ALTER TABLE "relatorio" DROP COLUMN "temporario",
ADD COLUMN     "remove_em" TIMESTAMPTZ(6),
ADD COLUMN     "remove_por" INTEGER;
