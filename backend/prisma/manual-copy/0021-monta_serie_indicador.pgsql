CREATE OR REPLACE FUNCTION monta_serie_indicador (pIndicador_id int, eh_serie_realizado boolean, pPeriodoStart date, pPeriodoEnd date)
    RETURNS varchar
    AS $$
DECLARE
    vStartTime timestamp;


    r record;
    serieRecord record;
    vInicio date;
    vFim date;                    -- Data fim original do indicador
    vFimIndicadorCalculo date;    -- Data fim a ser usada no cálculo de acumulado (quando vAcumuladoUsaFormula=false), ajustada pelos flags
    vTipoSerie "Serie";
    vAcumuladoUsaFormula boolean;
    vPeriodicidade interval;
    vIndicadorBase numeric;
    vIndicadorNumeroCasas integer;
    -- Feature Flags
    vFeatureFlagRealizadoApenasPassado boolean;
    vFeatureFlagPrevistoApenasPassado boolean;
    -- Last Dates for Indicator Series
    vUltimoIndicadorRealizado date;
    vUltimoIndicadorPrevisto date;
    vNow date; -- Current date
    -- resultado em double precision pq já passou por toda a conta
    resultado double precision;
    vStart timestamp;
    vPreviaRecord RECORD;
BEGIN
    EXECUTE pg_advisory_xact_lock(pIndicador_id::bigint);

    vStart := clock_timestamp();
    -- Calcula data atual uma vez
    vNow := (date_trunc('day', NOW() AT TIME ZONE 'America/Sao_Paulo'))::date;

    -- Carrega Feature Flags
    SELECT value::boolean INTO vFeatureFlagRealizadoApenasPassado
    FROM smae_config WHERE key = 'ACUMULADO_REALIZADO_APENAS_PASSADO' LIMIT 1;
    vFeatureFlagRealizadoApenasPassado := COALESCE(vFeatureFlagRealizadoApenasPassado, false);

    SELECT value::boolean INTO vFeatureFlagPrevistoApenasPassado
    FROM smae_config WHERE key = 'ACUMULADO_PREVISTO_APENAS_PASSADO' LIMIT 1;
    vFeatureFlagPrevistoApenasPassado := COALESCE(vFeatureFlagPrevistoApenasPassado, false);

    -- Coleta informações do indicador
    SELECT
        periodicidade_intervalo (i.periodicidade),
        -- Calcula o início efetivo baseado nos parâmetros e no início do indicador
        least (i.fim_medicao, greatest (coalesce(pPeriodoStart, i.inicio_medicao), i.inicio_medicao)) AS inicio_medicao,
        -- Calcula o fim efetivo baseado nos parâmetros e no fim do indicador
        greatest (i.inicio_medicao, least (coalesce(pPeriodoEnd, i.fim_medicao), i.fim_medicao)) AS fim_medicao,
        case
            when eh_serie_realizado is null then null
            when eh_serie_realizado then 'Realizado'::"Serie" else 'Previsto'::"Serie"
            end as tipo_serie,
            i.acumulado_usa_formula,
            i.acumulado_valor_base,
            coalesce(i.casas_decimais, 0)
        INTO vPeriodicidade,
        vInicio,
        vFim, -- Este é o fim original do indicador, usado como base
        vTipoSerie,
        vAcumuladoUsaFormula,
        vIndicadorBase,
        vIndicadorNumeroCasas
    FROM
        indicador i
    WHERE
        i.id = pIndicador_id;

    IF vInicio IS NULL THEN
        RETURN 'Indicador não encontrado';
    END IF;

    -- Loop principal para processar séries (base e acumulada se usar fórmula)
    -- Nota: 'Previa' não é processada aqui pois é input manual, apenas consumida no fallback
    FOR serieRecord IN
        WITH series AS (
            SELECT 'Realizado'::"Serie" as serie
            UNION ALL
            SELECT 'RealizadoAcumulado'::"Serie"
            UNION ALL
            SELECT 'Previsto'::"Serie"
            UNION ALL
            SELECT 'PrevistoAcumulado'::"Serie"
        )
        SELECT s.serie
        FROM series s
        WHERE (
         -- Nao é acumulado, então sempre processa (se tipo_serie permitir)
            s.serie::text NOT like '%Acumulado'
            OR
            -- Se é acumulado, só processa se o indicador usar a fórmula para o acumulado
            ( s.serie::text like '%Acumulado' AND vAcumuladoUsaFormula )
        )
        AND
        -- filtra apenas as series do tipo escolhido para recalcular, ou todas se for null
        ((vTipoSerie is null) OR ( s.serie::text like vTipoSerie::text || '%' ))
    LOOP

        -- Limpa dados existentes para o período/série atual
        -- Isso remove tanto valores normais (eh_previa=false) quanto valores sujos (eh_previa=true)
        -- para garantir que o recálculo seja limpo. A série 'Previa' pura não é afetada por este delete.
        IF (pPeriodoStart IS NULL AND pPeriodoEnd IS NULL) THEN
            -- Apaga toda a série se nenhum período específico foi dado
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id AND serie = serieRecord.serie;
        ELSE
            -- Apaga apenas o intervalo solicitado
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id
                AND serie = serieRecord.serie
                AND data_valor >= vInicio
                -- Inclui o limite superior para garantir que dados no último período sejam removidos se necessário
                AND data_valor < vFim + vPeriodicidade;
        END IF;

        -- Recalcula usando a fórmula para o período definido por vInicio e vFim
        FOR r IN
            SELECT
                serie, data_serie, formula, ha_conferencia_pendente
            from (
                SELECT
                    serieRecord.serie AS serie,
                    gs.gs AS data_serie,
                    monta_formula (pIndicador_id, serieRecord.serie, gs.gs::date)::jsonb AS formula_res
                FROM
                    generate_series(vInicio, vFim, vPeriodicidade) gs
            ) subq
             CROSS JOIN LATERAL (
                 SELECT
                  case when formula_res is null then null else formula_res->>'formula' end as formula,
                  coalesce((formula_res->>'ha_conferencia_pendente')::boolean, false) as ha_conferencia_pendente
             ) formula_data
             WHERE formula is not null -- Só processa se a fórmula foi gerada
                    ORDER BY 1 -- não faz diferença, mas fica melhor nos logs
        LOOP
            resultado := NULL;
            BEGIN
                EXECUTE 'SELECT ' || r.formula INTO resultado;

                IF (resultado IS NOT NULL) THEN
                    -- Insere o dado calculado LIMPO (eh_previa = false)
                    INSERT INTO serie_indicador (indicador_id, serie, data_valor, valor_nominal, ha_conferencia_pendente, eh_previa)
                        VALUES (pIndicador_id, r.serie, r.data_serie, resultado, r.ha_conferencia_pendente, false);

                    -- Lógica de Invalidação da Prévia:
                    -- Se calculamos um valor Realizado com sucesso, qualquer prévia para esta data se torna inválida.
                    IF r.serie = 'Realizado'::"Serie" THEN
                        UPDATE serie_indicador
                        SET previa_invalidada_em = now()
                        WHERE indicador_id = pIndicador_id
                          AND serie = 'Previa'::"Serie"
                          AND data_valor = r.data_serie
                          AND previa_invalidada_em IS NULL;
                    END IF;
                END IF;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE WARNING 'Indicador %: Erro ao executar fórmula para Serie=%, Data=%. Fórmula: %, Erro: %',
                        pIndicador_id, r.serie, r.data_serie, r.formula, SQLERRM;
                    -- Continua para o próximo período mesmo se um falhar
            END;
        END LOOP; -- fim loop recalculo por fórmula

        -- =========================================================================
        -- FALLBACK PARA PREVIA (Preenchimento de lacunas no Realizado)
        -- =========================================================================
        -- Se estivermos processando Realizado, verificamos se há Prévia válida onde o cálculo falhou (buracos)
        IF serieRecord.serie = 'Realizado'::"Serie" THEN
            -- Insere valores de Prévia válidos como Realizado SUJO (eh_previa = true) onde não há Realizado calculado
            INSERT INTO serie_indicador (
                indicador_id, serie, data_valor, valor_nominal,
                ha_conferencia_pendente, eh_previa, elementos
            )
            SELECT
                pIndicador_id,
                'Realizado'::"Serie",
                si.data_valor,
                si.valor_nominal,
                true, -- Assume pendência de conferência pois é um valor provisório
                true, -- Marca como derivado de prévia
                si.elementos
            FROM serie_indicador si
            WHERE si.indicador_id = pIndicador_id
            AND si.serie = 'Previa'::"Serie"
            AND si.previa_invalidada_em IS NULL
            AND si.data_valor >= vInicio
            AND si.data_valor <= vFim
            AND NOT EXISTS (
            SELECT 1 FROM serie_indicador si2
            WHERE si2.indicador_id = pIndicador_id
                AND si2.serie = 'Realizado'::"Serie"
                AND si2.data_valor = si.data_valor
            );
        END IF;

        -- =========================================================================
        -- RECALCULO DO ACUMULADO (QUANDO NÃO USA A FÓRMULA - vAcumuladoUsaFormula = false)
        -- =========================================================================
        -- Esta seção é executada após o cálculo da série base ('Realizado' ou 'Previsto')
        IF (vAcumuladoUsaFormula = false AND serieRecord.serie::text NOT LIKE '%Acumulado') THEN

            -- Inicializa a data fim de cálculo para o acumulado com o fim do indicador
            vFimIndicadorCalculo := vFim;

            -- AJUSTE 1: Se processando Realizado e flag ACUMULADO_REALIZADO_APENAS_PASSADO ativo
            IF serieRecord.serie = 'Realizado'::"Serie" AND vFeatureFlagRealizadoApenasPassado THEN
                SELECT COALESCE(max(data_valor), vInicio) INTO vUltimoIndicadorRealizado
                FROM serie_indicador WHERE indicador_id = pIndicador_id AND serie = 'Realizado'::"Serie";
                vFimIndicadorCalculo := LEAST(vFim, GREATEST(vUltimoIndicadorRealizado, vNow));
            END IF;

            -- AJUSTE 2: Se processando Previsto e flag ACUMULADO_PREVISTO_APENAS_PASSADO ativo
            IF serieRecord.serie = 'Previsto'::"Serie" AND vFeatureFlagPrevistoApenasPassado THEN
                SELECT COALESCE(max(data_valor), vInicio) INTO vUltimoIndicadorPrevisto
                FROM serie_indicador WHERE indicador_id = pIndicador_id AND serie = 'Previsto'::"Serie";
                vFimIndicadorCalculo := LEAST(vFim, GREATEST(vUltimoIndicadorPrevisto, vNow));
            END IF;

            -- Garante que a data fim de cálculo não seja menor que a data de início
            IF vFimIndicadorCalculo < vInicio THEN
                vFimIndicadorCalculo := vInicio;
            END IF;

            -- Apaga TODA a série acumulada correspondente antes de recalcular
            -- Necessário para remover pontos antigos se o período ou flags mudaram
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id
                AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

            -- Calcula e insere a série acumulada até vFimIndicadorCalculo
            INSERT INTO serie_indicador(indicador_id, serie, data_valor, valor_nominal, ha_conferencia_pendente, eh_previa)
            WITH theData AS (
                 SELECT
                     gs.gs as data_serie,
                     -- Soma o valor base do indicador com a soma acumulada da série base correspondente
                     round( vIndicadorBase + coalesce(sum(si.valor_nominal::numeric) OVER (order by gs.gs ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW), 0), vIndicadorNumeroCasas) as valor_acc,
                     -- Verifica se algum valor na janela acumulada tinha pendência de conferência
                     count(1) FILTER (WHERE si.ha_conferencia_pendente) OVER (order by gs.gs ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) > 0 as ha_conferencia_pendente,
                     -- Copia o flag eh_previa do registro atual para o acumulado
                     -- nao implementado: propagar a sujeira para o futuro, apenas copiar o estado do mês corrente, ja que esta desativado essa funcao
                     coalesce(si.eh_previa, false) as eh_previa
                 FROM
                     -- Gera a série de datas DENTRO DO PERÍODO DE CÁLCULO AJUSTADO (vInicio a vFimIndicadorCalculo)
                     generate_series(vInicio, vFimIndicadorCalculo, vPeriodicidade) gs
                 LEFT JOIN serie_indicador si
                     ON  si.indicador_id = pIndicador_id
                     AND si.data_valor = gs.gs::date
                     AND si.serie = serieRecord.serie -- Junta com a série base correspondente ('Realizado' ou 'Previsto')
            )
            SELECT
                pIndicador_id,
                (serieRecord.serie::text || 'Acumulado')::"Serie",
                td.data_serie,
                td.valor_acc,
                td.ha_conferencia_pendente,
                td.eh_previa
            FROM theData td
            WHERE td.valor_acc IS NOT NULL; -- Segurança, embora coalesce deva evitar nulls

        END IF; -- Fim do if (vAcumuladoUsaFormula = false)

    END LOOP; -- fim loop series

    -- Atualiza status do indicador
    UPDATE indicador me SET
        recalculando = false,
        recalculo_erro = null,
        recalculo_tempo = EXTRACT(EPOCH FROM (clock_timestamp() - vStart)),
        -- Atualiza flag de aviso se houver alguma pendência em QUALQUER série
        ha_avisos_data_fim = EXISTS (
            SELECT 1
            FROM serie_indicador si
            WHERE si.indicador_id = pIndicador_id
            AND si.ha_conferencia_pendente
        )
    WHERE me.id = pIndicador_id;

    RETURN '';
EXCEPTION
    WHEN OTHERS THEN
        -- Garante que 'recalculando' seja resetado mesmo em caso de erro
        UPDATE indicador me
        SET recalculando = false, recalculo_erro = 'Erro: ' || SQLERRM
        WHERE me.id = pIndicador_id;

        RAISE WARNING 'Erro em monta_serie_indicador para IndicadorId %: %', pIndicador_id, SQLERRM;
        RETURN 'Erro: ' || SQLERRM;
END
$$
LANGUAGE plpgsql;
