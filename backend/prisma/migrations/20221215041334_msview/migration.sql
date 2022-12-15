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
            sof_entidade ) a
    WHERE
        json_keys in ('projetos_atividades')
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
)
SELECT
    ano,
    col,
    trim((json_array_elements(arr)) ->> 'codigo') AS codigo,
    trim((json_array_elements(arr)) ->> 'descricao') AS descricao,
    (json_array_elements(arr)) ->> 'cod_orgao' AS cod_orgao
FROM
    lists;

CREATE INDEX ix_sof_entidades_linhas_generico
  ON sof_entidades_linhas (ano, col, codigo);

-- na teoria da pra usar qualquer coluna, mas os códigos dos outros items estão dando resultados duplicados
CREATE UNIQUE INDEX ix_uniq_sof_entidades_projetos_atividades
  ON sof_entidades_linhas (ano, codigo) where col = 'projetos_atividades';
