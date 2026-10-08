CREATE OR REPLACE FUNCTION fechar_ciclo_anterior(pPdmId INT, pNovoCicloId INT)
RETURNS VOID AS $$
DECLARE
    vCicloAnterior RECORD;
    vMeta RECORD;
    vPorBlocos BOOLEAN;
    vFases INT[];
    vFaseFechamento INT;
BEGIN
    -- FOR SHARE: espera a migração do plano para fases configuradas, se estiver em andamento
    SELECT p.monitoramento_por_blocos INTO vPorBlocos FROM pdm p WHERE p.id = pPdmId FOR SHARE;

    IF vPorBlocos THEN
        SELECT coalesce(array_agg(f.id ORDER BY f.ordem), '{}')
            INTO vFases
        FROM pdm_monitoramento_fase_config f
        WHERE f.pdm_id = pPdmId
          AND f.habilitada
          AND f.removido_em IS NULL;
        vFaseFechamento := vFases[cardinality(vFases)];
    END IF;

    -- Encontra todos os ciclos anteriores ativos do tipo CicloConfig
    FOR vCicloAnterior IN
        SELECT cf.id, cf.data_ciclo
        FROM ciclo_fisico cf
        WHERE cf.pdm_id = pPdmId
        AND cf.ativo = true
        AND cf.id != pNovoCicloId
        AND cf.tipo = 'CicloConfig'
    LOOP
        raise notice 'Fechando ciclo anterior %', vCicloAnterior.id;

        IF vPorBlocos THEN
            -- Mesma regra do legado: só fecha metas sem fechamento e com alguma fase anterior não preenchida
            FOR vMeta IN
                SELECT a.meta_id, a.faltantes
                FROM (
                    SELECT
                        m.id AS meta_id,
                        (
                            SELECT string_agg(f.rotulo, ', ' ORDER BY f.ordem)
                            FROM pdm_monitoramento_fase_config f
                            WHERE f.id = ANY (vFases[1:cardinality(vFases) - 1])
                            AND NOT EXISTS (
                                SELECT 1
                                FROM meta_monitoramento_fase r
                                WHERE r.meta_id = m.id
                                AND r.ciclo_fisico_id = vCicloAnterior.id
                                AND r.fase_config_id = f.id
                                AND r.ultima_revisao
                                AND r.removido_em IS NULL
                            )
                        ) AS faltantes
                    FROM meta m
                    WHERE m.pdm_id = pPdmId
                    AND m.removido_em IS NULL
                    AND vFaseFechamento IS NOT NULL
                    AND NOT EXISTS (
                        SELECT 1
                        FROM meta_monitoramento_fase r
                        WHERE r.meta_id = m.id
                        AND r.ciclo_fisico_id = vCicloAnterior.id
                        AND r.fecha_ciclo
                        AND r.ultima_revisao
                        AND r.removido_em IS NULL
                    )
                ) a
                WHERE a.faltantes IS NOT NULL
            LOOP
                -- revisão da fase de fechamento salva antes de ela virar a última fase
                UPDATE meta_monitoramento_fase
                SET ultima_revisao = false
                WHERE meta_id = vMeta.meta_id
                AND ciclo_fisico_id = vCicloAnterior.id
                AND fase_config_id = vFaseFechamento
                AND ultima_revisao
                AND removido_em IS NULL;

                INSERT INTO meta_monitoramento_fase (
                    meta_id,
                    ciclo_fisico_id,
                    fase_config_id,
                    referencia_data,
                    ultima_revisao,
                    fecha_ciclo,
                    comentario_sistema,
                    criado_por,
                    criado_em
                ) VALUES (
                    vMeta.meta_id,
                    vCicloAnterior.id,
                    vFaseFechamento,
                    vCicloAnterior.data_ciclo,
                    true,
                    true,
                    'Ciclo fechado automaticamente. Fases não preenchidas: ' || vMeta.faltantes,
                    -1, -- Usuário do sistema
                    now()
                );
            END LOOP;
        ELSE
            -- Insere registros de fechamento para todas as metas não completas em uma única operação
            INSERT INTO meta_ciclo_fisico_fechamento (
                meta_id,
                ciclo_fisico_id,
                referencia_data,
                comentario,
                criado_em,
                criado_por,
                ultima_revisao
            )
            SELECT
                m.id,
                vCicloAnterior.id,
                vCicloAnterior.data_ciclo,
                CASE
                    WHEN mcfa.id IS NULL AND mcfr.id IS NULL THEN 'Ciclo fechado automaticamente: Análise qualitativa e análise de risco não foram preenchidas'
                    WHEN mcfa.id IS NULL THEN 'Ciclo fechado automaticamente: Análise qualitativa não foi preenchida'
                    WHEN mcfr.id IS NULL THEN 'Ciclo fechado automaticamente: Análise de risco não foi preenchida'
                END,
                now(),
                -1, -- Usuário do sistema
                true
            FROM meta m
            LEFT JOIN meta_ciclo_fisico_analise mcfa ON mcfa.meta_id = m.id
                AND mcfa.ciclo_fisico_id = vCicloAnterior.id
                AND mcfa.ultima_revisao = true
                AND mcfa.removido_em IS NULL
            LEFT JOIN meta_ciclo_fisico_risco mcfr ON mcfr.meta_id = m.id
                AND mcfr.ciclo_fisico_id = vCicloAnterior.id
                AND mcfr.ultima_revisao = true
                AND mcfr.removido_em IS NULL
            LEFT JOIN meta_ciclo_fisico_fechamento mcff ON mcff.meta_id = m.id
                AND mcff.ciclo_fisico_id = vCicloAnterior.id
                AND mcff.ultima_revisao = true
                AND mcff.removido_em IS NULL
            WHERE m.pdm_id = pPdmId
            AND m.removido_em IS NULL
            AND mcff.id IS NULL  -- Apenas metas sem fechamento existente
            AND (mcfa.id IS NULL OR mcfr.id IS NULL); -- Análise ou risco não preenchidos
        END IF;

        raise notice 'Marcando ciclo anterior % como inativo', vCicloAnterior.id;
        -- Marca o ciclo anterior como inativo
        UPDATE ciclo_fisico
        SET ativo = false,
            acordar_ciclo_em = NULL,
            acordar_ciclo_executou_em = now()
        WHERE id = vCicloAnterior.id;
    END LOOP;
END;
$$ LANGUAGE plpgsql;
