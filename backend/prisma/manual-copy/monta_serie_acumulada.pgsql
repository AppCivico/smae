CREATE OR REPLACE FUNCTION monta_serie_acumulada (pVariavelId int, eh_serie_realizado boolean)
    RETURNS varchar
    AS $$
DECLARE
    serieRecord record;
    vPeriodicidade interval;
    vTipoSerie "Serie";
    vVariavelBase numeric;
    vVariavelNumeroCasas integer;
    vInicio date;
    vFim date;
BEGIN
    --
    WITH indicador_info AS (
        SELECT iv.variavel_id, iv.indicador_id
        FROM indicador_variavel iv
        WHERE iv.indicador_origem_id IS NULL
        AND iv.desativado = FALSE
        AND iv.variavel_id = pVariavelId
    ),
    periodo_data AS (
        SELECT
            v.id AS variavel_id,
            v.tipo,
            CASE
                WHEN v.tipo = 'Global' THEN
                    (SELECT me.periodicidade::INTERVAL FROM busca_periodos_variavel(v.id) me)
                WHEN v.tipo = 'PDM' THEN
                    (SELECT me.periodicidade::INTERVAL FROM busca_periodos_variavel(v.id, ii.indicador_id) me)
                ELSE NULL::INTERVAL
            END AS periodicidade,
            CASE
                WHEN v.tipo = 'Global' THEN
                    (SELECT min FROM busca_periodos_variavel(v.id))
                WHEN v.tipo = 'PDM' THEN
                    (SELECT min FROM busca_periodos_variavel(v.id, ii.indicador_id))
                ELSE NULL::date
            END AS inicio_medicao,
            CASE
                WHEN v.tipo = 'Global' THEN
                    (SELECT max FROM busca_periodos_variavel(v.id))
                WHEN v.tipo = 'PDM' THEN
                    (SELECT max FROM busca_periodos_variavel(v.id, ii.indicador_id))
                ELSE NULL::date
            END AS fim_medicao
        FROM variavel v
        LEFT JOIN indicador_info ii ON v.id = ii.variavel_id
    )
    SELECT
        CASE
            WHEN eh_serie_realizado IS NULL THEN NULL
            WHEN eh_serie_realizado THEN 'Realizado'::"Serie"
            ELSE 'Previsto'::"Serie"
        END AS tipo_serie,
        v.valor_base,
        pd.periodicidade,
        pd.inicio_medicao,
        pd.fim_medicao,
        v.casas_decimais
    INTO
        vTipoSerie,
        vVariavelBase,
        vPeriodicidade,
        vInicio,
        vFim,
        vVariavelNumeroCasas
    FROM
        variavel v
    JOIN periodo_data pd ON v.id = pd.variavel_id
    WHERE v.id = pVariavelId;

    -- double check
    -- se a pessoa ligou, o sistema fez a conta, e entao remover a opção, os valores já calculados vão ficar
    IF vInicio IS NULL THEN
        RETURN 'Variavel não encontrada';
    END IF;
    FOR serieRecord IN WITH series AS (
        -- series 'base' para o calculo da Acumulada
        SELECT
            'Realizado'::"Serie" AS serie
        UNION ALL
        SELECT
            'Previsto'::"Serie"
    )
    SELECT
        s.serie
    FROM
        series s
    WHERE
        -- filtra apenas as series do tipo escolhido para recalcular, ou todas se for null
        ((vTipoSerie IS NULL)
            OR (s.serie::text LIKE vTipoSerie::text || '%'))
            LOOP
                -- apaga o periodo escolhido
                DELETE FROM serie_variavel
                WHERE variavel_id = pVariavelId
                    AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

                RAISE NOTICE '==> acumulado serie_variavel (variavel=%', pVariavelId::text || ', serie=' || serieRecord.serie::text;
                INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal)
                WITH theData AS (
                    SELECT
                        pVariavelId,
                        (serieRecord.serie::text || 'Acumulado')::"Serie",
                        gs.gs AS data_serie,
                        round( vVariavelBase + coalesce(sum(sv.valor_nominal::numeric) OVER (ORDER BY gs.gs), 0), vVariavelNumeroCasas) AS valor_acc
                    FROM
                        generate_series(vInicio, vFim, vPeriodicidade) gs
                    LEFT JOIN serie_variavel sv ON sv.variavel_id = pVariavelId
                        AND data_valor = gs.gs::date
                        AND sv.serie = serieRecord.serie
)
                SELECT
                    *
                FROM
                    theData
            WHERE
                theData.valor_acc IS NOT NULL;
            END LOOP;
    -- loop resultados das series
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

