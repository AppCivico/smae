-- CreateTable
CREATE TABLE "ps_dashboard_consolidado" (
    "id" SERIAL NOT NULL,
    "item_id" INTEGER NOT NULL,
    "tipo" TEXT NOT NULL,
    "pdm_id" INTEGER NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "iniciativa_id" INTEGER,
    "atividade_id" INTEGER,
    "orcamento_total" INTEGER NOT NULL DEFAULT 0,
    "orcamento_preenchido" INTEGER NOT NULL DEFAULT 0,
    "pendencia_orcamento" BOOLEAN NOT NULL DEFAULT false,
    "cronograma_total" INTEGER NOT NULL DEFAULT 0,
    "cronograma_atraso_inicio" INTEGER NOT NULL DEFAULT 0,
    "cronograma_atraso_fim" INTEGER NOT NULL DEFAULT 0,
    "pendencia_cronograma" BOOLEAN NOT NULL DEFAULT false,
    "variaveis_total" INTEGER NOT NULL DEFAULT 0,
    "variaveis_a_coletar" INTEGER NOT NULL DEFAULT 0,
    "variaveis_a_coletar_atrasadas" INTEGER NOT NULL DEFAULT 0,
    "variaveis_coletadas_nao_conferidas" INTEGER NOT NULL DEFAULT 0,
    "variaveis_conferidas_nao_liberadas" INTEGER NOT NULL DEFAULT 0,
    "variaveis_liberadas" INTEGER NOT NULL DEFAULT 0,
    "fase_atual" "CicloFase" NOT NULL DEFAULT 'Analise',
    "fase_analise_preenchida" BOOLEAN NOT NULL DEFAULT false,
    "fase_risco_preenchida" BOOLEAN NOT NULL DEFAULT false,
    "fase_fechamento_preenchida" BOOLEAN NOT NULL DEFAULT false,
    "pendente" BOOLEAN NOT NULL DEFAULT false,
    "pendente_variavel" BOOLEAN NOT NULL DEFAULT false,
    "pendente_cronograma" BOOLEAN NOT NULL DEFAULT false,
    "pendente_orcamento" BOOLEAN NOT NULL DEFAULT false,
    "atualizado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ciclo_fisico_id" INTEGER NOT NULL,

    CONSTRAINT "ps_dashboard_consolidado_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ps_dashboard_consolidado_meta_id_idx" ON "ps_dashboard_consolidado"("meta_id");

-- CreateIndex
CREATE UNIQUE INDEX "ps_dashboard_consolidado_item_id_tipo_key" ON "ps_dashboard_consolidado"("item_id", "tipo");

-- AddForeignKey
ALTER TABLE "ps_dashboard_consolidado" ADD CONSTRAINT "ps_dashboard_consolidado_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ps_dashboard_consolidado" ADD CONSTRAINT "ps_dashboard_consolidado_iniciativa_id_fkey" FOREIGN KEY ("iniciativa_id") REFERENCES "iniciativa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ps_dashboard_consolidado" ADD CONSTRAINT "ps_dashboard_consolidado_atividade_id_fkey" FOREIGN KEY ("atividade_id") REFERENCES "atividade"("id") ON DELETE SET NULL ON UPDATE CASCADE;
