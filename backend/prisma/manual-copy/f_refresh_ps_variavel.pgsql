CREATE OR REPLACE FUNCTION recalc_vars_ps_dashboard(variaveis integer[])
RETURNS integer AS $$
DECLARE
    total_processado integer := 0;
    num_rows integer;
BEGIN
    CREATE TEMP TABLE temp_valid_vars AS
    SELECT 
        vcc.variavel_id,
        vcc.fase,
        vvg.planos,
        CASE WHEN cardinality(vcc.atrasos) > 1 THEN true ELSE false END AS possui_atrasos,
        array_agg(gre.id) AS equipes,
        array_remove(array_agg(gre.orgao_id), NULL) AS equipes_orgaos
    FROM 
        variavel_ciclo_corrente vcc
        JOIN variavel v ON vcc.variavel_id = v.id
        JOIN view_variavel_global vvg ON v.id = vvg.id
        LEFT JOIN variavel_grupo_responsavel_equipe vgre 
            ON v.id = vgre.variavel_id 
            AND vgre.removido_em IS NULL
        LEFT JOIN grupo_responsavel_equipe gre 
            ON vgre.grupo_responsavel_equipe_id = gre.id
    WHERE 
        vcc.variavel_id = ANY(variaveis)
        AND vcc.eh_corrente = TRUE
    GROUP BY 
        vcc.variavel_id, vcc.fase, vvg.planos, vcc.atrasos;

    DELETE FROM ps_dashboard_variavel
    WHERE variavel_id = ANY(variaveis)
    AND variavel_id NOT IN (SELECT variavel_id FROM temp_valid_vars);

    GET DIAGNOSTICS num_rows = ROW_COUNT;
    total_processado := total_processado + num_rows;

    INSERT INTO ps_dashboard_variavel (
        variavel_id,
        pdm_id,
        fase,
        fase_preenchimento_preenchida,
        fase_validacao_preenchida,
        fase_liberacao_preenchida,
        equipes,
        equipes_orgaos,
        possui_atrasos
    )
    SELECT
        vv.variavel_id,
        vv.planos::integer[],
        vv.fase::"VariavelFase",
        (vv.fase = 'Validacao' OR vv.fase = 'Liberacao'),
        (vv.fase = 'Liberacao'),
        false,
        vv.equipes::integer[],
        vv.equipes_orgaos::integer[],
        vv.possui_atrasos
    FROM temp_valid_vars vv
    ON CONFLICT (variavel_id)
    DO UPDATE SET
        pdm_id = EXCLUDED.pdm_id,
        fase = EXCLUDED.fase,
        fase_preenchimento_preenchida = EXCLUDED.fase_preenchimento_preenchida,
        fase_validacao_preenchida = EXCLUDED.fase_validacao_preenchida,
        fase_liberacao_preenchida = EXCLUDED.fase_liberacao_preenchida,
        equipes = EXCLUDED.equipes,
        equipes_orgaos = EXCLUDED.equipes_orgaos;

    GET DIAGNOSTICS num_rows = ROW_COUNT;
    total_processado := total_processado + num_rows;

    DROP TABLE temp_valid_vars;
    RETURN total_processado;

EXCEPTION
    WHEN others THEN
        DROP TABLE IF EXISTS temp_valid_vars;
        RAISE;
END;
$$ LANGUAGE plpgsql;
