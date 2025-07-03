DROP FUNCTION IF EXISTS recalc_vars_ps_dashboard(integer[]) ;

CREATE OR REPLACE FUNCTION recalc_vars_ps_dashboard(p_variaveis integer[])
RETURNS integer AS $$
DECLARE
    num_rows integer;
    family_ids_to_process integer[];
BEGIN
    -- 1. Determina os IDs de família distintos (ID do pai ou próprio ID se não tiver pai)
    --    para todas as variáveis de entrada. Isso garante que operamos no nível consolidado do pai.
    SELECT array_agg(DISTINCT COALESCE(v.variavel_mae_id, v.id))
    INTO family_ids_to_process
    FROM variavel v
    WHERE v.id = ANY(p_variaveis)
      AND v.removido_em IS NULL;

    -- Se nenhum ID de família relevante e não removido for encontrado, sai mais cedo.
    IF family_ids_to_process IS NULL OR array_length(family_ids_to_process, 1) IS NULL THEN
        RETURN 0;
    END IF;

    -- 2. Exclui entradas existentes para essas famílias para garantir dados atualizados.
    --    O ps_dashboard_variavel.variavel_id armazena o family_id.
    DELETE FROM ps_dashboard_variavel
    WHERE variavel_id = ANY(family_ids_to_process);

    -- 3. Insere dados atualizados para as famílias de variáveis relevantes ativas no ciclo atual.
    INSERT INTO ps_dashboard_variavel (
        variavel_id,
        pdm_id,      -- PDMs ativos associados à família
        pdm_id_completo, -- Todos os PDMs (ativos/inativos) associados à família
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
    WITH
    -- Mapeia todas as variáveis (pais/filhos) dentro das famílias alvo para seus PDMs associados
    pdm_mapping AS (
        SELECT DISTINCT
            COALESCE(v.variavel_mae_id, v.id) AS family_id, -- Agrupa pelo ID da família
            pi.pdm_id,
            p.ativo
        FROM
            variavel v
            JOIN indicador_variavel iv ON v.id = iv.variavel_id
            JOIN indicador i ON iv.indicador_id = i.id AND i.removido_em IS NULL
            JOIN view_metas_arvore_pdm pi ON
                (pi.tipo = 'meta' AND i.meta_id = pi.id) OR
                (pi.tipo = 'iniciativa' AND i.iniciativa_id = pi.id) OR
                (pi.tipo = 'atividade' AND i.atividade_id = pi.id)
            JOIN pdm p ON pi.pdm_id = p.id
        WHERE
            COALESCE(v.variavel_mae_id, v.id) = ANY(family_ids_to_process) -- Filtra pelas famílias alvo derivadas anteriormente
            AND v.removido_em IS NULL -- Considera apenas variáveis ativas para mapeamento de PDM
    ),
    -- Agrega IDs de PDM por família
    planos_data AS (
        SELECT
            family_id,
            COALESCE(array_agg(DISTINCT pdm_id) FILTER (WHERE ativo = TRUE), '{}'::integer[]) AS pdm_ids_ativos,
            COALESCE(array_agg(DISTINCT pdm_id), '{}'::integer[]) AS pdm_ids_completos
        FROM
            pdm_mapping
        GROUP BY
            family_id
    ),
    -- Agrega equipes responsáveis por família (responsabilidade é definida no nível da variável pai/individual)
    equipes_data AS (
        SELECT
            v.id AS family_id, -- O ID aqui é o family_id porque filtramos por family_ids_to_process
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.id IS NOT NULL), '{}'::integer[]) AS equipes,
            COALESCE(array_agg(DISTINCT gre.orgao_id) FILTER (WHERE gre.orgao_id IS NOT NULL), '{}'::integer[]) AS equipes_orgaos,
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.perfil = 'Medicao'::"PerfilResponsavelEquipe"), '{}'::integer[]) AS equipes_preenchimento,
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.perfil = 'Validacao'::"PerfilResponsavelEquipe"), '{}'::integer[]) AS equipes_conferencia,
            COALESCE(array_agg(DISTINCT gre.id) FILTER (WHERE gre.perfil = 'Liberacao'::"PerfilResponsavelEquipe"), '{}'::integer[]) AS equipes_liberacao
        FROM
            variavel v -- Precisamos apenas de informações para as variáveis pai/individuais (os family_ids)
            LEFT JOIN variavel_grupo_responsavel_equipe vgre ON
                v.id = vgre.variavel_id AND vgre.removido_em IS NULL
            LEFT JOIN grupo_responsavel_equipe gre ON
                vgre.grupo_responsavel_equipe_id = gre.id
        WHERE
            v.id = ANY(family_ids_to_process)
        GROUP BY v.id
    )
    -- Seleção final e cálculo para inserção, usando o family_id
    SELECT
        vcc.variavel_id, -- Este É o family_id porque vcc é indexado por COALESCE(v.variavel_mae_id, v.id)
        COALESCE(pd.pdm_ids_ativos, '{}'::integer[]),
        COALESCE(pd.pdm_ids_completos, '{}'::integer[]),
        vcc.fase::"VariavelFase",
        -- Determina se as fases estão concluídas com base na fase atual da família
        (vcc.fase IN ( 'Preenchimento', 'Validacao' , 'Liberacao' ) AND vcc.liberacao_enviada = TRUE), -- fase_validacao_preenchida
        (vcc.fase IN ( 'Preenchimento', 'Validacao' ) AND vcc.liberacao_enviada = TRUE), -- fase_validacao_preenchida
        vcc.fase = 'Liberacao' AND vcc.liberacao_enviada = TRUE, -- fase_liberacao_preenchida
        COALESCE(ed.equipes, '{}'::integer[]),
        COALESCE(ed.equipes_orgaos, '{}'::integer[]),
        COALESCE(ed.equipes_preenchimento, '{}'::integer[]),
        COALESCE(ed.equipes_conferencia, '{}'::integer[]),
        COALESCE(ed.equipes_liberacao, '{}'::integer[]),
        -- Verifica atrasos com base nas informações de ciclo da família (prazo, atrasos do vcc)
        (vcc.atrasos IS NOT NULL AND vcc.atrasos <> '{}') OR (vcc.prazo IS NOT NULL AND vcc.prazo < (CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')::date)
    FROM variavel_ciclo_corrente vcc
    JOIN variavel v ON vcc.variavel_id = v.id AND v.removido_em IS NULL
    LEFT JOIN planos_data pd ON vcc.variavel_id = pd.family_id
    LEFT JOIN equipes_data ed ON vcc.variavel_id = ed.family_id
    LEFT JOIN variavel_categorica vc ON v.variavel_categorica_id = vc.id
    WHERE
        vcc.variavel_id = ANY(family_ids_to_process)
        AND vcc.eh_corrente = TRUE
        -- Exclui tipos de variáveis não relevantes para esta visão do painel (perspectiva de preenchimento do usuário)
        AND v.tipo <> 'Composta'::"TipoVariavel"  -- Exclui variáveis calculadas (com base no tipo do pai)
        AND (v.variavel_categorica_id IS NULL OR vc.tipo <> 'Cronograma'::"TipoVariavelCategorica"); -- Exclui variáveis de cronograma (com base na categoria do pai)

    GET DIAGNOSTICS num_rows = ROW_COUNT;

    RETURN num_rows;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Erro em recalc_vars_ps_dashboard: %', SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql;

delete from ps_dashboard_variavel;
select recalc_vars_ps_dashboard(array_agg(id)) from variavel where tipo = 'Global' and variavel_mae_id is null and removido_em is null;
