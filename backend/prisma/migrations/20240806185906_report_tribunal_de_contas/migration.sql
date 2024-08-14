-- AlterEnum
ALTER TYPE "FonteRelatorio"
ADD VALUE 'TribunalDeContas';
-- CreateTable
CREATE TABLE "status_sei" (
    "id" SERIAL NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "processo_sei" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "status_code" INTEGER,
    "resumo_status_code" INTEGER,
    "json_resposta" JSON DEFAULT '{}',
    "resumo_json_resposta" JSON DEFAULT '{}',
    "sei_hash" TEXT NOT NULL,
    "resumo_hash" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMPTZ(6),
    "sei_atualizado_em" TIMESTAMPTZ(6),
    "resumo_atualizado_em" TIMESTAMPTZ(6),
    CONSTRAINT "status_sei_pkey" PRIMARY KEY ("id")
);
-- CreateIndex
CREATE UNIQUE INDEX "status_sei_processo_sei_key" ON "status_sei"("processo_sei");
