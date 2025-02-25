-- CreateIndex
CREATE INDEX "meta_orcamento_projeto_id_idx" ON "meta_orcamento"("projeto_id");


CREATE INDEX IF NOT EXISTS ix_projeto__codigo on projeto (codigo, tipo) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_projeto__nome on projeto (nome, tipo) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_projeto__status on projeto ("status", tipo) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_projeto__registrado_em on projeto (registrado_em, tipo) where removido_em IS NULL;

CREATE INDEX IF NOT EXISTS ix_projeto__tipo_id on projeto (tipo, id) where removido_em IS NULL;

CREATE INDEX IF NOT EXISTS ix_tarefa_cronograma__id on tarefa_cronograma (id) where removido_em IS NULL;

CREATE INDEX IF NOT EXISTS ix_meta_orcamento__projeto_id on meta_orcamento (projeto_id) where removido_em IS NULL AND ultima_revisao;
CREATE INDEX IF NOT EXISTS ix_meta_orcamento__meta_id on meta_orcamento (meta_id) where removido_em IS NULL AND ultima_revisao;


CREATE INDEX IF NOT EXISTS ix_portfolio__titulo on portfolio (titulo) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_grupo_tematico__nome on grupo_tematico (nome) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_tipo_intervencao__nome on tipo_intervencao (nome) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_equipamento__nome on equipamento (nome) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_orgao__descricao on orgao (descricao) where removido_em IS NULL;
CREATE INDEX IF NOT EXISTS ix_orgao__sigla on orgao (sigla) where removido_em IS NULL;
