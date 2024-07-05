CREATE OR REPLACE VIEW view_variavel_global AS
WITH PlanoSetorial AS (
    SELECT
        variavel_id,
        array_agg(DISTINCT pdm_id) AS pdm_ids
    FROM
        mv_variavel_pdm
    GROUP BY
        1
),
AssuntoVariavel AS (
    SELECT
        variavel_id,
        array_agg(DISTINCT av.assunto_variavel_id) AS assunto_ids
    FROM
        variavel_assunto_variavel AS av
    GROUP BY
        1
)
SELECT
    v.id,
    v.titulo,
    v.codigo,
    v.orgao_id,
    v.orgao_proprietario_id,
    coalesce(ps.pdm_ids, '{}'::int[]) AS planos,
    v.periodicidade,
    v.inicio_medicao,
    v.fim_medicao,
    v.criado_em,
    coalesce(av.assunto_ids, '{}'::int[]) AS assunto_ids,
    tipo
FROM
    variavel AS v
    LEFT JOIN PlanoSetorial ps ON v.id = ps.variavel_id
    LEFT JOIN AssuntoVariavel av ON v.id = av.variavel_id
WHERE
    v.removido_em IS NULL;

