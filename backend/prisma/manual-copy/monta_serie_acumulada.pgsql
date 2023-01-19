CREATE OR REPLACE FUNCTION monta_serie_acumulada (pVariavelId int, eh_serie_realizado boolean)
    RETURNS varchar
    AS $$
DECLARE
    serieRecord record;
    vPeriodicidade interval;
    vTipoSerie "Serie";
    vVariavelBase numeric;
    vInicio date;
    vFim date;
BEGIN
    --
    SELECT
        CASE WHEN eh_serie_realizado IS NULL THEN
            NULL
        WHEN eh_serie_realizado THEN
            'Realizado'::"Serie"
        ELSE
            'Previsto'::"Serie"
        END AS tipo_serie,
        v.valor_base,
        bv.periodicidade,
        bv.inicio_medicao,
        bv.fim_medicao INTO vTipoSerie,
        vVariavelBase,
        vPeriodicidade,
        vInicio,
        vFim
    FROM
        variavel v
        -- na primeira versao, buscava-se pelo periodo do indicador original, mas claramente isso mostra uma falha no modelo de dados,
        -- pois os indicadores auxiliares desta forma não conseguem ter dados de serie, pra resolver isso,
        -- vamos pegar o menor periodo de preenchimento, junto com os limites extremos de inicio/fim dos indicadores onde a variavel foi utilizada
    CROSS JOIN busca_periodos_variavel (v.id) AS bv (periodicidade,
        inicio_medicao,
        fim_medicao)
WHERE
    v.id = pVariavelId
        AND acumulativa;
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
                INSERT INTO serie_variavel (variavel_id, serie, data_valor, valor_nominal)
                WITH theData AS (
                    SELECT
                        pVariavelId,
                        (serieRecord.serie::text || 'Acumulado')::"Serie",
                        gs.gs AS data_serie,
                        coalesce(sum(sv.valor_nominal::numeric) OVER (ORDER BY gs.gs), case when serieRecord.serie = 'Realizado'::"Serie" then null else vVariavelBase end) AS valor_acc
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

