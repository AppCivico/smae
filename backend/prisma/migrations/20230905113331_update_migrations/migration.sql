
CREATE OR REPLACE FUNCTION atualiza_ano_orcamento_projeto(pProjetoId int)
    RETURNS varchar
    AS $$
DECLARE
    v_anos  int[];
BEGIN

    WITH _int AS (
        SELECT
            extract('year' FROM previsao_inicio) AS ini,
            extract('year' FROM coalesce(realizado_termino, previsao_termino, previsao_inicio)) AS fim
        FROM
            projeto
        WHERE
            id = pProjetoId
    ),
    _anos AS ( SELECT ano.ano FROM _int, generate_series(ini::int, fim::int, 1) ano ),
    _prev_custo AS (
        SELECT DISTINCT ano_referencia
        FROM meta_orcamento
        WHERE projeto_id = pProjetoId AND removido_em IS NULL
    ),
    _orc_plan AS (
        SELECT DISTINCT ano_referencia
        FROM orcamento_planejado
        WHERE projeto_id = pProjetoId AND removido_em IS NULL
    ),
    _orc_real AS (
        SELECT DISTINCT ano_referencia
        FROM orcamento_realizado
        WHERE projeto_id = pProjetoId AND removido_em IS NULL
    ),
    _range AS (
        SELECT ano
        FROM _anos
        UNION ALL
        SELECT ano_referencia
        FROM _orc_plan
        UNION ALL
        SELECT *
        FROM _prev_custo
        UNION ALL
        SELECT *
        FROM _orc_real
    )
    SELECT
        array_agg(DISTINCT ano ORDER BY ano) into v_anos
    FROM _range;

    UPDATE projeto
    SET ano_orcamento = v_anos
    WHERE id = pProjetoId
    AND ano_orcamento is DISTINCT from v_anos;

    return '';
END
$$
LANGUAGE plpgsql;
