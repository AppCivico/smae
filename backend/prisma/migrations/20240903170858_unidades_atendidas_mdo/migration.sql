-- AlterTable
ALTER TABLE "grupo_tematico" ADD COLUMN     "unidades_atendidas" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "mdo_n_unidades_atendidas" INTEGER;
