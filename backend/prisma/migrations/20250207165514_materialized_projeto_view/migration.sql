CREATE MATERIALIZED VIEW view_painel_estrategico_projeto AS
SELECT
    p.id AS projeto_id,
    p.orgao_responsavel_id,
    org.sigla as orgao_sigla,
    org.descricao as orgao_descricao,
    m.id as meta_id,
    p.portfolio_id,
    p.status,
    p.projeto_etapa_id,
    tc.realizado_termino,
    EXTRACT(YEAR FROM tc.realizado_termino) as ano_termino,
    EXTRACT(MONTH FROM tc.realizado_termino) as mes_termino,
    tc.previsao_termino,
    EXTRACT(YEAR FROM tc.previsao_termino) as ano_previsao
FROM projeto p
LEFT JOIN tarefa_cronograma tc ON tc.projeto_id = p.id AND tc.removido_em IS NULL
LEFT JOIN orgao org ON p.orgao_responsavel_id = org.id
LEFT JOIN meta m ON p.meta_id = m.id AND m.removido_em IS NULL AND exists(SELECT 1 FROM pdm WHERE pdm.id = m.pdm_id AND pdm.tipo = 'PDM')
WHERE p.removido_em IS NULL
  AND p.tipo = 'PP'
  AND p.arquivado = false;

CREATE INDEX idx_view_painel_proj_previsao ON view_painel_estrategico_projeto (ano_previsao);
CREATE INDEX idx_view_painel_proj_realizado_prev ON view_painel_estrategico_projeto (realizado_termino, previsao_termino);
CREATE INDEX idx_view_painel_proj_termino ON view_painel_estrategico_projeto (ano_termino, mes_termino);
CREATE INDEX idx_view_painel_proj_orgao ON view_painel_estrategico_projeto (orgao_responsavel_id);
CREATE INDEX idx_view_painel_proj_meta ON view_painel_estrategico_projeto (meta_id);
CREATE INDEX idx_view_painel_proj_portfolio ON view_painel_estrategico_projeto (portfolio_id);
CREATE INDEX idx_painel_proj_orgao_count ON view_painel_estrategico_projeto (orgao_responsavel_id, projeto_id);
