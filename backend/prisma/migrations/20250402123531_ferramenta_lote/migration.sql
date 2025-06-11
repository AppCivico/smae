-- CreateEnum
CREATE TYPE "TipoAtualizacaoEmLote" AS ENUM ('ProjetoPP', 'ProjetoMDO');

-- CreateEnum
CREATE TYPE "StatusAtualizacaoEmLote" AS ENUM ('Pendente', 'Executando', 'Concluido', 'ConcluidoParcialmente', 'Falhou', 'Abortado');

-- CreateTable
CREATE TABLE "atualizacao_em_lote" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoAtualizacaoEmLote" NOT NULL,
    "status" "StatusAtualizacaoEmLote" NOT NULL DEFAULT 'Pendente',
    "target_ids" INTEGER[],
    "operacao" JSONB NOT NULL,
    "n_total" INTEGER NOT NULL,
    "n_sucesso" INTEGER NOT NULL DEFAULT 0,
    "n_erro" INTEGER NOT NULL DEFAULT 0,
    "n_ignorado" INTEGER NOT NULL DEFAULT 0,
    "results_log" JSONB,
    "sucesso_ids" INTEGER[],
    "task_id" INTEGER,
    "modulo_sistema" "ModuloSistema" NOT NULL,
    "criado_por_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "iniciou_em" TIMESTAMPTZ(6),
    "terminou_em" TIMESTAMP(6),
    "removido_por_id" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "atualizacao_em_lote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "atualizacao_em_lote_criado_em_tipo_idx" ON "atualizacao_em_lote"("criado_em", "tipo");

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_removido_por_id_fkey" FOREIGN KEY ("removido_por_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
