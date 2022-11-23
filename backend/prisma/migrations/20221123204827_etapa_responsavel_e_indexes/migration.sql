-- DropIndex
DROP INDEX "meta_ciclo_fisico_analise_documento_ciclo_fisico_id_idx";

-- CreateTable
CREATE TABLE "etapa_responsavel" (
    "id" SERIAL NOT NULL,
    "etapa_id" INTEGER NOT NULL,
    "pessoa_id" INTEGER NOT NULL,

    CONSTRAINT "etapa_responsavel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "etapa_responsavel_pessoa_id_idx" ON "etapa_responsavel"("pessoa_id");

-- CreateIndex
CREATE INDEX "etapa_responsavel_etapa_id_idx" ON "etapa_responsavel"("etapa_id");

-- CreateIndex
CREATE INDEX "arquivo_documento_arquivo_id_idx" ON "arquivo_documento"("arquivo_id");

-- CreateIndex
CREATE INDEX "atividade_iniciativa_id_idx" ON "atividade"("iniciativa_id");

-- CreateIndex
CREATE INDEX "atividade_orgao_atividade_id_idx" ON "atividade_orgao"("atividade_id");

-- CreateIndex
CREATE INDEX "atividade_orgao_orgao_id_idx" ON "atividade_orgao"("orgao_id");

-- CreateIndex
CREATE INDEX "atividade_responsavel_atividade_id_idx" ON "atividade_responsavel"("atividade_id");

-- CreateIndex
CREATE INDEX "atividade_responsavel_orgao_id_idx" ON "atividade_responsavel"("orgao_id");

-- CreateIndex
CREATE INDEX "atividade_tag_atividade_id_idx" ON "atividade_tag"("atividade_id");

-- CreateIndex
CREATE INDEX "ciclo_fisico_pdm_id_idx" ON "ciclo_fisico"("pdm_id");

-- CreateIndex
CREATE INDEX "ciclo_fisico_data_ciclo_idx" ON "ciclo_fisico"("data_ciclo");

-- CreateIndex
CREATE INDEX "ciclo_fisico_fase_ciclo_fisico_id_idx" ON "ciclo_fisico_fase"("ciclo_fisico_id");

-- CreateIndex
CREATE INDEX "cronograma_atividade_id_idx" ON "cronograma"("atividade_id");

-- CreateIndex
CREATE INDEX "cronograma_iniciativa_id_idx" ON "cronograma"("iniciativa_id");

-- CreateIndex
CREATE INDEX "cronograma_meta_id_idx" ON "cronograma"("meta_id");

-- CreateIndex
CREATE INDEX "cronograma_etapa_cronograma_id_idx" ON "cronograma_etapa"("cronograma_id");

-- CreateIndex
CREATE INDEX "cronograma_etapa_etapa_id_idx" ON "cronograma_etapa"("etapa_id");

-- CreateIndex
CREATE INDEX "cronograma_orgao_cronograma_id_idx" ON "cronograma_orgao"("cronograma_id");

-- CreateIndex
CREATE INDEX "cronograma_orgao_orgao_id_idx" ON "cronograma_orgao"("orgao_id");

-- CreateIndex
CREATE INDEX "etapa_regiao_id_idx" ON "etapa"("regiao_id");

-- CreateIndex
CREATE INDEX "etapa_etapa_pai_id_idx" ON "etapa"("etapa_pai_id");

-- CreateIndex
CREATE INDEX "etapa_cronograma_id_idx" ON "etapa"("cronograma_id");

-- CreateIndex
CREATE INDEX "iniciativa_meta_id_idx" ON "iniciativa"("meta_id");

-- CreateIndex
CREATE INDEX "iniciativa_orgao_iniciativa_id_idx" ON "iniciativa_orgao"("iniciativa_id");

-- CreateIndex
CREATE INDEX "iniciativa_orgao_orgao_id_idx" ON "iniciativa_orgao"("orgao_id");

-- CreateIndex
CREATE INDEX "iniciativa_responsavel_iniciativa_id_idx" ON "iniciativa_responsavel"("iniciativa_id");

-- CreateIndex
CREATE INDEX "iniciativa_responsavel_orgao_id_idx" ON "iniciativa_responsavel"("orgao_id");

-- CreateIndex
CREATE INDEX "iniciativa_tag_iniciativa_id_idx" ON "iniciativa_tag"("iniciativa_id");

-- CreateIndex
CREATE INDEX "meta_ciclo_fisico_analise_documento_meta_id_ciclo_fisico_id_idx" ON "meta_ciclo_fisico_analise_documento"("meta_id", "ciclo_fisico_id");

-- CreateIndex
CREATE INDEX "meta_orgao_orgao_id_idx" ON "meta_orgao"("orgao_id");

-- CreateIndex
CREATE INDEX "meta_orgao_meta_id_idx" ON "meta_orgao"("meta_id");

-- CreateIndex
CREATE INDEX "meta_responsavel_meta_id_idx" ON "meta_responsavel"("meta_id");

-- CreateIndex
CREATE INDEX "meta_tag_meta_id_idx" ON "meta_tag"("meta_id");

-- CreateIndex
CREATE INDEX "meta_tag_tag_id_idx" ON "meta_tag"("tag_id");

-- CreateIndex
CREATE INDEX "objetivo_estrategico_pdm_id_idx" ON "objetivo_estrategico"("pdm_id");

-- CreateIndex
CREATE INDEX "painel_pdm_id_idx" ON "painel"("pdm_id");

-- CreateIndex
CREATE INDEX "painel_conteudo_painel_id_idx" ON "painel_conteudo"("painel_id");

-- CreateIndex
CREATE INDEX "painel_conteudo_meta_id_idx" ON "painel_conteudo"("meta_id");

-- CreateIndex
CREATE INDEX "painel_conteudo_detalhe_painel_conteudo_id_idx" ON "painel_conteudo_detalhe"("painel_conteudo_id");

-- CreateIndex
CREATE INDEX "painel_conteudo_detalhe_pai_id_idx" ON "painel_conteudo_detalhe"("pai_id");

-- CreateIndex
CREATE INDEX "painel_grupos_painel_id_idx" ON "painel_grupos"("painel_id");

-- CreateIndex
CREATE INDEX "painel_grupos_grupo_painel_id_idx" ON "painel_grupos"("grupo_painel_id");

-- CreateIndex
CREATE INDEX "pdm_ativo_idx" ON "pdm"("ativo");

-- CreateIndex
CREATE INDEX "pessoa_email_idx" ON "pessoa"("email");

-- CreateIndex
CREATE INDEX "pessoa_acesso_pdm_pessoa_id_idx" ON "pessoa_acesso_pdm"("pessoa_id");

-- CreateIndex
CREATE INDEX "pessoa_grupo_painel_pessoa_id_idx" ON "pessoa_grupo_painel"("pessoa_id");

-- CreateIndex
CREATE INDEX "pessoa_grupo_painel_grupo_painel_id_idx" ON "pessoa_grupo_painel"("grupo_painel_id");

-- CreateIndex
CREATE INDEX "pessoa_perfil_pessoa_id_idx" ON "pessoa_perfil"("pessoa_id");

-- CreateIndex
CREATE INDEX "regiao_parente_id_idx" ON "regiao"("parente_id");

-- CreateIndex
CREATE INDEX "serie_variavel_variavel_id_data_valor_idx" ON "serie_variavel"("variavel_id", "data_valor");

-- CreateIndex
CREATE INDEX "status_meta_ciclo_fisico_pessoa_id_idx" ON "status_meta_ciclo_fisico"("pessoa_id");

-- CreateIndex
CREATE INDEX "status_meta_ciclo_fisico_ciclo_fisico_id_idx" ON "status_meta_ciclo_fisico"("ciclo_fisico_id");

-- CreateIndex
CREATE INDEX "status_variavel_ciclo_fisico_variavel_id_idx" ON "status_variavel_ciclo_fisico"("variavel_id");

-- CreateIndex
CREATE INDEX "status_variavel_ciclo_fisico_ciclo_fisico_id_idx" ON "status_variavel_ciclo_fisico"("ciclo_fisico_id");

-- CreateIndex
CREATE INDEX "tag_pdm_id_idx" ON "tag"("pdm_id");

-- CreateIndex
CREATE INDEX "variavel_regiao_id_idx" ON "variavel"("regiao_id");

-- CreateIndex
CREATE INDEX "variavel_ciclo_fisico_documento_ciclo_fisico_id_variavel_id_idx" ON "variavel_ciclo_fisico_documento"("ciclo_fisico_id", "variavel_id");

-- CreateIndex
CREATE INDEX "variavel_ciclo_fisico_pedido_complementacao_ciclo_fisico_id_idx" ON "variavel_ciclo_fisico_pedido_complementacao"("ciclo_fisico_id", "variavel_id", "ultima_revisao");

-- CreateIndex
CREATE INDEX "variavel_responsavel_variavel_id_idx" ON "variavel_responsavel"("variavel_id");

-- AddForeignKey
ALTER TABLE "etapa_responsavel" ADD CONSTRAINT "etapa_responsavel_pessoa_id_fkey" FOREIGN KEY ("pessoa_id") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "etapa_responsavel" ADD CONSTRAINT "etapa_responsavel_etapa_id_fkey" FOREIGN KEY ("etapa_id") REFERENCES "etapa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
