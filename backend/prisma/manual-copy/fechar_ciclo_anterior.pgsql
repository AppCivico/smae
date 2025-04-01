CREATE OR REPLACE FUNCTION fechar_ciclo_anterior(pPdmId INT, pNovoCicloId INT)
RETURNS VOID AS $$
DECLARE
    vCicloAnterior RECORD;
BEGIN
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
