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
    vAcumulativa boolean;
BEGIN
    EXECUTE pg_advisory_xact_lock(pVariavelId::bigint);

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
            v.acumulativa,
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
        v.casas_decimais,
        pd.acumulativa
    INTO
        vTipoSerie,
        vVariavelBase,
        vPeriodicidade,
        vInicio,
        vFim,
        vVariavelNumeroCasas,
        vAcumulativa
    FROM
        variavel v
    JOIN periodo_data pd ON v.id = pd.variavel_id
    WHERE v.id = pVariavelId;

    -- Validation check
    IF vInicio IS NULL THEN
        RETURN 'Variavel não encontrada';
    END IF;

    -- Process each series type (Realizado/Previsto)
    FOR serieRecord IN WITH series AS (
        SELECT
            'Realizado'::"Serie" AS serie
        UNION ALL
        SELECT
            'Previsto'::"Serie"
    )
    SELECT s.serie
    FROM series s
    -- Filtra apenas as series do tipo escolhido [parâmetro] para recalcular, ou todas se for null
    WHERE ((vTipoSerie IS NULL) OR (s.serie::text LIKE vTipoSerie::text || '%'))
    LOOP
        -- Sempre deleta a serie acumulada antes de inserir
        DELETE FROM serie_variavel
        WHERE variavel_id = pVariavelId
            AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

        -- Apenas recalcular a serie acumulada se a variavel for acumulativa
        IF vAcumulativa THEN
            RAISE NOTICE '==> acumulado serie_variavel (variavel=%', pVariavelId::text || ', serie=' || serieRecord.serie::text;

            INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal)
            WITH theData AS (
                SELECT
                    pVariavelId,
                    (serieRecord.serie::text || 'Acumulado')::"Serie",
                    gs.gs AS data_serie,
                    round(
                        vVariavelBase + coalesce(sum(sv.valor_nominal::numeric) OVER (ORDER BY gs.gs), 0),
                        vVariavelNumeroCasas
                    ) AS valor_acc
                FROM
                    generate_series(vInicio, vFim, vPeriodicidade) gs
                LEFT JOIN serie_variavel sv ON sv.variavel_id = pVariavelId
                    AND data_valor = gs.gs::date
                    AND sv.serie = serieRecord.serie
            )
            SELECT *
            FROM theData
            WHERE theData.valor_acc IS NOT NULL;
        ELSE
            -- Reinserir a serie usando os valores originais, sem acumular
            -- se não vamos gerar um bug... isso é bem ineficiente, mas é o que temos pra agora
            INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal)
            SELECT
                pVariavelId,
                (serieRecord.serie::text || 'Acumulado')::"Serie",
                sv.data_valor,
                sv.valor_nominal
            FROM serie_variavel sv
            WHERE sv.variavel_id = pVariavelId
                AND sv.serie = serieRecord.serie;
        END IF;
    END LOOP;

    RETURN '';
END
$$
LANGUAGE plpgsql;
