
-- CreateTable
CREATE TABLE "meta_orcamento_consolidado" (
    "meta_id" INTEGER NOT NULL PRIMARY KEY,
    
    -- Totais gerais
    "total_previsao" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_empenhado" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_liquidado" DECIMAL(19,2) NOT NULL DEFAULT 0,
    
    -- Totais de Projetos (primeiro dígito ímpar)
    "total_previsao_projeto" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_empenhado_projeto" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_liquidado_projeto" DECIMAL(19,2) NOT NULL DEFAULT 0,
    
    -- Totais de Atividades (primeiro dígito par e != 0)
    "total_previsao_atividade" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_empenhado_atividade" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_liquidado_atividade" DECIMAL(19,2) NOT NULL DEFAULT 0,
    
    -- Totais de Operações Especiais (primeiro dígito = 0)
    "total_previsao_operacao_especial" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_empenhado_operacao_especial" DECIMAL(19,2) NOT NULL DEFAULT 0,
    "total_liquidado_operacao_especial" DECIMAL(19,2) NOT NULL DEFAULT 0,
    
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "meta_orcamento_consolidado_meta_id_fkey" 
        FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "meta_orcamento_consolidado_atualizado_em_idx" ON "meta_orcamento_consolidado"("atualizado_em");
