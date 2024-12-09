CREATE OR REPLACE VIEW view_painel_estrategico_projeto AS
WITH portfolio_projeto AS (
    SELECT
        ppc.projeto_id,
        po_1.id AS portfolio_id
    FROM portfolio_projeto_compartilhado ppc
    JOIN portfolio po_1 ON po_1.id = ppc.portfolio_id
    WHERE ppc.removido_em IS NULL
)
SELECT
    p.id AS projeto_id,
    p.orgao_responsavel_id,
    p.meta_id,
    COALESCE(po.portfolio_id, p.portfolio_id) AS portfolio_id
FROM projeto p
FULL OUTER JOIN portfolio_projeto po ON po.projeto_id = p.id
WHERE p.removido_em IS NULL
  AND p.tipo = 'PP'
  AND p.arquivado = false;