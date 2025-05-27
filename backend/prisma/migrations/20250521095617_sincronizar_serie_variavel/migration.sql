-- AlterTable
ALTER TABLE "variavel_global_ciclo_analise" ADD COLUMN     "sincronizar_serie_variavel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "sv_sincronizado_em" TIMESTAMP(3);
