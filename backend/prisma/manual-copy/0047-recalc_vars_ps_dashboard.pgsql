CREATE OR REPLACE FUNCTION recalc_vars_ps_dashboard(variaveis integer[])
RETURNS integer AS $$
DECLARE
    num_rows integer;
BEGIN
    -- Apaga sempre já que vai dar update no conflict, que é tão caro quanto insert
    DELETE FROM ps_dashboard_variavel
    WHERE variavel_id = ANY(variaveis);

    -- Insere todos os registros
    INSERT INTO ps_dashboard_variavel (
        variavel_id,
        pdm_id,
        pdm_id_inativo,
        fase,
        fase_preenchimento_preenchida,
        fase_validacao_preenchida,
        fase_liberacao_preenchida,
        equipes,
        equipes_orgaos,
        equipes_preenchimento,
        equipes_conferencia,
        equipes_liberacao,
        possui_atrasos
    )
    WITH pdm_mapping AS (
        SELECT DISTINCT
            v.id AS variavel_id,
            pi.pdm_id
        FROM
            variavel v
            JOIN indicador_variavel iv ON v.id = iv.variavel_id
            JOIN indicador i ON iv.indicador_id = i.id
            JOIN view_metas_arvore_pdm pi ON
                (pi.tipo = 'meta' AND i.meta_id = pi.id) OR
                (pi.tipo = 'iniciativa' AND i.iniciativa_id = pi.id) OR
                (pi.tipo = 'atividade' AND i.atividade_id = pi.id)
        WHERE
            v.removido_em IS NULL
            AND v.id = ANY(variaveis)
    ),
    planos_data AS (
        SELECT
            variavel_id,
            array_agg(DISTINCT pdm_id) AS pdm_ids
        FROM
            pdm_mapping
        GROUP BY
            variavel_id
    ),
    equipes_data AS (
        SELECT
            v.id AS variavel_id,
            -- Lista completa de equipes e órgãos
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.id IS NOT NULL), '{}'::integer[]) AS equipes,
            COALESCE(array_agg(DISTINCT gre.orgao_id) FILTER (WHERE gre.orgao_id IS NOT NULL), '{}'::integer[]) AS equipes_orgaos,
            
            -- Novas colunas baseadas no perfil
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.perfil = 'Medicao'::"PerfilResponsavelEquipe"), '{}'::integer[]) AS equipes_preenchimento,
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.perfil = 'Validacao'::"PerfilResponsavelEquipe"), '{}'::integer[]) AS equipes_conferencia,
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.perfil = 'Liberacao'::"PerfilResponsavelEquipe"), '{}'::integer[]) AS equipes_liberacao
        FROM
            variavel v
            LEFT JOIN variavel_grupo_responsavel_equipe vgre ON
                v.id = vgre.variavel_id AND vgre.removido_em IS NULL
            LEFT JOIN grupo_responsavel_equipe gre ON
                vgre.grupo_responsavel_equipe_id = gre.id
        WHERE
            v.id = ANY(variaveis)
        GROUP BY
            v.id
    )
    SELECT
        vcc.variavel_id,
        COALESCE(pd.pdm_ids, '{}'::integer[]),
        vcc.fase::"VariavelFase",

        -- (vcc.fase IN ( 'Validacao', 'Liberacao' ) OR (vcc.fase = 'Preenchimento' AND vcc.atrasos IS NULL OR vcc.atrasos = '{}')),
        -- mas acho que deveria ser:
        (vcc.fase IN ( 'Preenchimento', 'Validacao' , 'Liberacao' ) AND vcc.liberacao_enviada = TRUE), -- fase_validacao_preenchida

        (vcc.fase IN ( 'Preenchimento', 'Validacao' ) AND vcc.liberacao_enviada = TRUE), -- fase_validacao_preenchida
        vcc.fase = 'Liberacao' AND vcc.liberacao_enviada = TRUE, -- fase_liberacao_preenchida
        ed.equipes,
        ed.equipes_orgaos,
        ed.equipes_preenchimento,
        ed.equipes_conferencia,
        ed.equipes_liberacao,
        
        -- pegar prazo para indicar se possui atrasos
        -- arr de prazos pode estar vazia
        -- caso o prazo seja < hoje
        CASE WHEN ((vcc.atrasos IS NOT NULL AND vcc.atrasos <> '{}') OR (vcc.prazo < now()::Date)) THEN true ELSE false END
    FROM variavel_ciclo_corrente vcc
    JOIN variavel v ON vcc.variavel_id = v.id
    LEFT JOIN planos_data pd ON vcc.variavel_id = pd.variavel_id
    LEFT JOIN equipes_data ed ON vcc.variavel_id = ed.variavel_id
    LEFT JOIN variavel_categorica vc ON v.variavel_categorica_id = vc.id
    WHERE
        vcc.variavel_id = ANY(variaveis)
        AND vcc.eh_corrente = TRUE
        AND v.removido_em IS NULL
    -- tiras as variáveis de cronograma, que o próprio cronograma já contabiliza
    AND (v.variavel_categorica_id IS NULL OR vc.tipo <> 'Cronograma'::"TipoVariavelCategorica")
    AND v.tipo = 'Global';

    GET DIAGNOSTICS num_rows = ROW_COUNT;

    RETURN num_rows;
EXCEPTION
    WHEN others THEN
        RAISE;
END;
$$ LANGUAGE plpgsql;

select recalc_vars_ps_dashboard(array_agg(id)) from variavel where tipo = 'Global';
