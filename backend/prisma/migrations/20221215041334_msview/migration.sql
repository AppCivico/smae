--drop MATERIALIZED VIEW sof_entidades_linhas;
CREATE MATERIALIZED VIEW sof_entidades_linhas AS
WITH dict AS (
    SELECT
        ano,
        array_agg(json_keys) AS keys
    FROM (
        SELECT
            json_object_keys(dados) AS json_keys,
            ano
        FROM
            sof_entidade) a
    WHERE
        json_keys IN ('projetos_atividades', 'unidades', 'fonte_recursos', 'orgaos')
        -- json_keys not in ('metadados')
    GROUP BY
        ano
),
exploded AS (
    SELECT
        ano,
        unnest(keys) AS k
    FROM
        dict
),
lists AS (
    SELECT
        sof.ano,
        e.k AS col,
        json_extract_path(sof.dados, e.k) AS arr
    FROM
        exploded e
        JOIN sof_entidade sof ON sof.ano = e.ano
),
lines AS (
    SELECT
        ano,
        col,
        trim((json_array_elements(arr)) ->> 'codigo') AS codigo,
        (json_array_elements(arr)) ->> 'cod_orgao' AS cod_orgao,
        trim((json_array_elements(arr)) ->> 'descricao') AS descricao
    FROM
        lists
)
SELECT
    ano,
    col,
    coalesce(codigo, '') AS codigo,
    coalesce(cod_orgao, '') AS cod_orgao,
    string_agg(descricao, ' / ' ORDER BY descricao) AS descricao
FROM
    lines
GROUP BY
    1,
    2,
    3,
    4;

CREATE INDEX ix_sof_entidades_linhas_generico ON sof_entidades_linhas (ano, col, codigo)
WHERE
    col != 'projetos_atividades';

CREATE UNIQUE INDEX ix_uniq_sof_entidades_projetos_atividades ON sof_entidades_linhas (ano, codigo)
WHERE
    col = 'projetos_atividades';

