CREATE OR REPLACE FUNCTION monta_serie_indicador (pIndicador_id int, eh_serie_realizado boolean, pPeriodoStart date, pPeriodoEnd date)
    RETURNS varchar
    AS $$
DECLARE
    vStartTime timestamp;


    r record;
    serieRecord record;
    vInicio date;
    vFim date;
    vTipoSerie "Serie";
    vAcumuladoUsaFormula boolean;
    vPeriodicidade interval;
    vIndicadorBase numeric;
    vIndicadorNumeroCasas integer;
    -- resultado em double precision pq já passou por toda a conta
    resultado double precision;
BEGIN
    EXECUTE pg_advisory_xact_lock(pIndicador_id::bigint);
    --
    SELECT
        periodicidade_intervalo (i.periodicidade),
        least (i.fim_medicao, greatest (coalesce(pPeriodoStart, i.inicio_medicao), i.inicio_medicao)) AS inicio_medicao,
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
        vFim,
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
         -- nao é acumulado entao retorna
            s.serie::text NOT like '%Acumulado'
            OR
            -- se é acumulado, só retorna se o indicador deseja usar a formula
            ( s.serie::text like '%Acumulado' AND vAcumuladoUsaFormula )
        )
        AND
        -- filtra apenas as series do tipo escolhido para recalcular, ou todas se for null
        ((vTipoSerie is null) OR ( s.serie::text like vTipoSerie::text || '%' ))
        LOOP

            vStartTime := clock_timestamp();

            -- se a função (e não as variaveis da função) foram null, reprocessa todo o indicador
            IF (pPeriodoStart IS NULL AND pPeriodoEnd IS NULL) THEN

                -- apaga todo o periodo do indicador, sendo acumulado ou não
                DELETE FROM serie_indicador
                WHERE indicador_id = pIndicador_id
                    AND serie = serieRecord.serie;

            ELSE

                ----RAISE NOTICE '==> delete serie_indicador (indicador=%', pIndicador_id::text || ', serie=' || serieRecord.serie::text ||', vInicio = '|| coalesce(vInicio::text,'(todos)') || ', fim=' || coalesce(vFim::text,'todos') ||') vAcumuladoUsaFormula ' || vAcumuladoUsaFormula;
                --raise NOTICE 'apagando serie_indicador... %s', serieRecord.serie;
                -- apaga o periodo escolhido
                --raise NOTICE 'apagou serie_indicador em %s', clock_timestamp() - vStartTime;
                DELETE FROM serie_indicador
                WHERE indicador_id = pIndicador_id
                    AND serie = serieRecord.serie
                    AND data_valor >= vInicio
                    AND data_valor < vFim + (select periodicidade_intervalo(vPeriodicidade)) ;
            END IF;

            vStartTime := clock_timestamp();
            --raise NOTICE 'recalculando serie_indicador... %', serieRecord.serie;
            -- recalcula o periodo
            FOR r IN
                SELECT
                    serie,
                    data_serie,
                    case when formula_res is null then null else formula_res->>'formula' end as formula,
                    (formula_res->>'ha_conferencia_pendente')::boolean as ha_conferencia_pendente
                from (
                    SELECT
                        serieRecord.serie AS serie,
                        gs.gs AS data_serie,
                        monta_formula (pIndicador_id, serieRecord.serie, gs.gs::date)::jsonb AS formula_res
                    FROM
                        generate_series(vInicio, vFim, vPeriodicidade) gs
                    ORDER BY 1 -- não faz diferença, mas fica melhor nos logs
                ) subq
            LOOP
                resultado := NULL;

                IF (r.formula IS NOT NULL) THEN

                    EXECUTE 'SELECT ' || r.formula INTO resultado;

                    IF (resultado IS NOT NULL) THEN
                        INSERT INTO serie_indicador (indicador_id, serie, data_valor, valor_nominal, ha_conferencia_pendente)
                            VALUES (pIndicador_id, r.serie, r.data_serie, resultado, r.ha_conferencia_pendente);
                    ELSE
                        ----RAISE NOTICE ' RESULTADO NULO %', ROW_TO_JSON(r) || ' => ' || coalesce(resultado::text, '(null)');
                    END IF;
                END IF;

                ----RAISE NOTICE 'r %', ROW_TO_JSON(r) || ' => ' || coalesce(resultado::text, '(null)');
            END LOOP; -- loop resultados da periodo da serie
        --raise NOTICE 'recalculou serie_indicador em %', clock_timestamp() - vStartTime;


        -- se não é pra usar a formula, então vamos recalcular automaticamente a serie acumulada usando os resultados
        IF (vAcumuladoUsaFormula = false) THEN
            vStartTime := clock_timestamp();

            --raise NOTICE 'recalculando acumulado... %', serieRecord.serie;
            -- muito arriscado fazer usando os periodos, então recalcula tudo
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id
                AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

            INSERT INTO serie_indicador(indicador_id, serie, data_valor, valor_nominal, ha_conferencia_pendente)
            WITH theData AS (
                WITH indData AS (
                    SELECT
                        periodicidade_intervalo (i.periodicidade) as periodicidade,
                        i.inicio_medicao as inicio_medicao,
                        i.fim_medicao as fim_medicao
                    FROM
                        indicador i
                    WHERE
                        i.id = pIndicador_id
                )
                SELECT
                    pIndicador_id,
                    (serieRecord.serie::text || 'Acumulado')::"Serie",
                    gs.gs as data_serie,
                    round( vIndicadorBase + coalesce(sum(si.valor_nominal::numeric) OVER (order by gs.gs), 0), vIndicadorNumeroCasas) as valor_acc,
                    count(1) FILTER (WHERE si.ha_conferencia_pendente) OVER (order by gs.gs) > 0 as ha_conferencia_pendente
                FROM
                    generate_series(
                    (select inicio_medicao from indData),
                    (select fim_medicao from indData),
                    (select periodicidade from indData)
                ) gs
                LEFT JOIN serie_indicador si
                    ON  si.indicador_id = pIndicador_id
                    AND data_valor = gs.gs::date
                    AND si.serie = serieRecord.serie
            ) SELECT * from theData where theData.valor_acc is not null;

            --raise NOTICE 'recalculado acumulado em %', clock_timestamp() - vStartTime;
        END IF ;

    END LOOP; -- loop resultados das series

    UPDATE indicador me
    SET
        recalculando = false,
        ha_avisos_data_fim = (
            SELECT count(1) > 0
            FROM serie_indicador
            WHERE indicador_id = pIndicador_id
            AND ha_conferencia_pendente
        )
    WHERE me.id = pIndicador_id;

    --
    RETURN '';

END
$$
LANGUAGE plpgsql;

