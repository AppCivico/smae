-- CreateEnum
CREATE TYPE "TipoAtualizacaoEmLote" AS ENUM ('ProjetoPP', 'ProjetoMDO');

-- CreateEnum
CREATE TYPE "StatusAtualizacaoEmLote" AS ENUM ('Pendente', 'Executando', 'Concluido', 'ConcluidoParcialmente', 'Falhou', 'Abortado');

-- CreateTable
CREATE TABLE "view_ps_dashboard_consolidado" (
    "id" INTEGER NOT NULL,
    "item_id" INTEGER NOT NULL,
    "tipo" "PsDashboardConsolidadoTipo" NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "variaveis" INTEGER[],
    "orcamento_total" INTEGER[],
    "orcamento_preenchido" INTEGER[],
    "pendencia_orcamento" BOOLEAN NOT NULL,
    "cronograma_total" INTEGER NOT NULL,
    "cronograma_atraso_inicio" INTEGER NOT NULL,
    "cronograma_atraso_fim" INTEGER NOT NULL,
    "cronograma_preenchido" INTEGER NOT NULL,
    "pendencia_cronograma" BOOLEAN NOT NULL,
    "variaveis_total" INTEGER NOT NULL,
    "variaveis_total_no_ciclo" INTEGER NOT NULL,
    "variaveis_a_coletar" INTEGER NOT NULL,
    "variaveis_a_coletar_atrasadas" INTEGER NOT NULL,
    "variaveis_coletadas_nao_conferidas" INTEGER NOT NULL,
    "variaveis_conferidas_nao_liberadas" INTEGER NOT NULL,
    "variaveis_liberadas" INTEGER NOT NULL,
    "fase_atual" "CicloFase",
    "fase_analise_preenchida" BOOLEAN NOT NULL,
    "fase_risco_preenchida" BOOLEAN NOT NULL,
    "fase_fechamento_preenchida" BOOLEAN NOT NULL,
    "equipes_orgaos" INTEGER[],
    "equipes" INTEGER[],
    "pendente" BOOLEAN NOT NULL,
    "pendente_variavel" BOOLEAN NOT NULL,
    "pendente_cronograma" BOOLEAN NOT NULL,
    "pendente_orcamento" BOOLEAN NOT NULL,
    "atualizado_em" TIMESTAMP(3) NOT NULL,
    "ciclo_fisico_id" INTEGER,
    "meta_codigo" TEXT NOT NULL,
    "meta_titulo" TEXT NOT NULL,
    "iniciativa_codigo" TEXT,
    "iniciativa_titulo" TEXT,
    "atividade_codigo" TEXT,
    "atividade_titulo" TEXT,
    "order_meta" TEXT NOT NULL,
    "order_iniciativa" TEXT NOT NULL,
    "order_atividade" TEXT NOT NULL,

    CONSTRAINT "view_ps_dashboard_consolidado_pkey" PRIMARY KEY ("id")
);

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
CREATE UNIQUE INDEX "view_ps_dashboard_consolidado_item_id_tipo_key" ON "view_ps_dashboard_consolidado"("item_id", "tipo");

-- CreateIndex
CREATE INDEX "atualizacao_em_lote_criado_em_tipo_idx" ON "atualizacao_em_lote"("criado_em", "tipo");

-- AddForeignKey
ALTER TABLE "view_ps_dashboard_consolidado" ADD CONSTRAINT "view_ps_dashboard_consolidado_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_ps_dashboard_consolidado" ADD CONSTRAINT "view_ps_dashboard_consolidado_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "view_ps_dashboard_consolidado" ADD CONSTRAINT "view_ps_dashboard_consolidado_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "task_queue"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "atualizacao_em_lote" ADD CONSTRAINT "atualizacao_em_lote_removido_por_id_fkey" FOREIGN KEY ("removido_por_id") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
