CREATE OR REPLACE VIEW view_variavel_global AS
WITH AssuntoVariavel AS (
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
    coalesce(ps.pdm_id, '{}'::int[]) AS planos,
    v.periodicidade,
    v.inicio_medicao,
    v.fim_medicao,
    v.criado_em,
    coalesce(av.assunto_ids, '{}'::int[]) AS assunto_ids,
    tipo,
    fonte.id AS fonte_id,
    fonte.nome AS fonte_nome,
    v.possui_variaveis_filhas,
    v.variavel_mae_id,
    v.regiao_id
FROM
    variavel AS v
    LEFT JOIN ps_dashboard_variavel ps ON v.id = ps.variavel_id
    LEFT JOIN AssuntoVariavel av ON v.id = av.variavel_id
    LEFT JOIN fonte_variavel fonte ON v.fonte_id = fonte.id
WHERE
    v.removido_em IS NULL;


