-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "atraso" INTEGER,
ADD COLUMN     "percentual_concluido" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "realizado_duracao" INTEGER;
