-- AlterTable
ALTER TABLE "cronograma" ALTER COLUMN "inicio_previsto" DROP NOT NULL,
ALTER COLUMN "termino_previsto" DROP NOT NULL;

CREATE UNIQUE INDEX ON "cronograma" (ativo) WHERE ativo = TRUE;