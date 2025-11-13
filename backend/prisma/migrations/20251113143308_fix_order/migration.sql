
WITH ranked_etapas AS (
    SELECT
        id,
        tipo_projeto,
        ROW_NUMBER() OVER (
            PARTITION BY tipo_projeto
            ORDER BY
                CASE WHEN ordem_painel IS NULL THEN 1 ELSE 0 END,
                ordem_painel ASC,
                id ASC
        ) AS nova_ordem
    FROM projeto_etapa
    WHERE
        removido_em IS NULL
        AND eh_padrao = true
)
UPDATE projeto_etapa
SET ordem_painel = ranked_etapas.nova_ordem
FROM ranked_etapas
WHERE projeto_etapa.id = ranked_etapas.id;
