-- AlterTable
ALTER TABLE "relatorio" ADD COLUMN     "progresso" SMALLINT NOT NULL DEFAULT -1,
ADD COLUMN     "restrito_para" JSON;
