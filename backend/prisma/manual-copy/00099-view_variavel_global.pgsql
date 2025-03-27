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


/* se a de cima começar a dar problema pq o ps_dashboard_variavel só tem as Globais, podemos usar essa versão 'in the middle'

CREATE OR REPLACE VIEW view_variavel_global AS
WITH PlanoSetorial AS (
    SELECT
        variavel_id,
        array_agg(DISTINCT pdm_id) AS pdm_ids
    FROM
        mv_variavel_pdm
    WHERE EXISTS (
        SELECT 1 FROM variavel v
        WHERE v.id = variavel_id
        AND v.tipo = 'Composta'
        AND v.removido_em IS NULL
    )
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
    CASE
        WHEN v.tipo = 'Composta' THEN coalesce(ps.pdm_ids, '{}'::int[])
        ELSE coalesce(psd.pdm_id, '{}'::int[])
    END AS planos,
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
    LEFT JOIN ps_dashboard_variavel psd ON v.id = psd.variavel_id AND v.tipo != 'Composta'
    LEFT JOIN PlanoSetorial ps ON v.id = ps.variavel_id AND v.tipo = 'Composta'
    LEFT JOIN AssuntoVariavel av ON v.id = av.variavel_id
    LEFT JOIN fonte_variavel fonte ON v.fonte_id = fonte.id
WHERE
    v.removido_em IS NULL;

*/

