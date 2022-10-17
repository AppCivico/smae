CREATE OR REPLACE FUNCTION monta_serie_indicador (pIndicador_id int, eh_serie_realizado boolean, pPeriodoStart date, pPeriodoEnd date)
    RETURNS varchar
    AS $$
DECLARE
    r record;
    serieRecord record;
    vInicio date;
    vFim date;
    vTipoSerie "Serie";
    vAcumuladoUsaFormula boolean;
    vPeriodicidade interval;
    vIndicadorBase numeric;
    -- resultado em double precision pq já passou por toda a conta
    resultado double precision;
BEGIN
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
            i.acumulado_valor_base
        INTO vPeriodicidade,
        vInicio,
        vFim,
        vTipoSerie,
        vAcumuladoUsaFormula,
        vIndicadorBase
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
            -- apaga o periodo escolhido
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id
                AND serie = serieRecord.serie
                AND data_valor >= vInicio
                AND data_valor <= vFim -- aqui acho que precisa virar < e na hora de calcular tbm tirar 1 periodo
                AND regiao_id IS NULL;

            -- recalcula o periodo
            FOR r IN
                SELECT
                    serieRecord.serie AS serie,
                    gs.gs AS data_serie,
                    monta_formula (pIndicador_id, serieRecord.serie, gs.gs::date) AS formula
                FROM
                    generate_series(vInicio, vFim, vPeriodicidade) gs
                ORDER BY 1 -- não faz diferença, mas fica melhor nos logs
            LOOP
                resultado := NULL;

                IF (r.formula IS NOT NULL) THEN
                    EXECUTE 'SELECT ' || r.formula INTO resultado;
                    INSERT INTO serie_indicador (indicador_id, regiao_id, serie, data_valor, valor_nominal)
                        VALUES (pIndicador_id, NULL, r.serie, r.data_serie, resultado);
                END IF;

                RAISE NOTICE 'r %', ROW_TO_JSON(r) || ' => ' || coalesce(resultado::text, '(null)');
            END LOOP; -- loop resultados da periodo da serie

        -- se não é pra usar a formula, entrao vamos recalcular automaticamente a serie acumulada usando os resultados
        IF (vAcumuladoUsaFormula = false) THEN
            -- muito arriscado fazer usando os periodos, entao recaclula tudo
            DELETE FROM serie_indicador
            WHERE indicador_id = pIndicador_id
                AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie"
                AND regiao_id IS NULL;

            INSERT INTO serie_indicador(indicador_id, regiao_id, serie, data_valor, valor_nominal)
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
                    si.regiao_id,
                    (serieRecord.serie::text || 'Acumulado')::"Serie",
                    gs.gs as data_serie,
                    coalesce(sum(si.valor_nominal) OVER (PARTITION BY si.regiao_id order by gs.gs), vIndicadorBase) as valor_acc
                FROM
                    generate_series(
                    (select inicio_medicao from indData),
                    (select fim_medicao from indData),
                    (select periodicidade from indData)
                ) gs
                LEFT JOIN serie_indicador si
                    ON si.regiao_id is null
                    AND si.indicador_id = pIndicador_id
                    AND data_valor = gs.gs::date
                    AND si.serie = serieRecord.serie
            ) SELECT * from theData where theData.valor_acc is not null;

        END IF ;
    END LOOP; -- loop resultados das series
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

