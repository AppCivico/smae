-- AlterTable
ALTER TABLE "variavel_ciclo_corrente" ADD COLUMN     "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "liberacao_enviada" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "variavel_global_ciclo_analise" ADD COLUMN     "eh_liberacao_auto" BOOLEAN NOT NULL DEFAULT false;
