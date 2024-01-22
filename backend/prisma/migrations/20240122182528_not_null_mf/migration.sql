-- AlterTable
ALTER TABLE "meta_status_consolidado_cf" ALTER COLUMN "analise_qualitativa_enviada" DROP NOT NULL,
ALTER COLUMN "risco_enviado" DROP NOT NULL,
ALTER COLUMN "fechamento_enviado" DROP NOT NULL;
