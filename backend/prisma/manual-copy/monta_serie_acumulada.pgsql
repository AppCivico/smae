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
        periodicidade_intervalo (i.periodicidade) as periodicidade,
        case
            when eh_serie_realizado is null then null
            when eh_serie_realizado then 'Realizado'::"Serie" else 'Previsto'::"Serie"
        end as tipo_serie,
            v.valor_base,
            i.inicio_medicao,
            i.fim_medicao
        INTO
            vPeriodicidade,
            vTipoSerie,
            vVariavelBase,
            vInicio,
            vFim
    FROM
        variavel v
        -- busca o periodo do indicador original, mas claramente isso mostra uma falha no modelo de dados,
        -- pois os indicadores auxiliares desta forma não conseguem ter dados de serie, pra resolver isso,
        -- cada relacionamento precisaria ter o proprio inicio/fim de acordo com indicador, e ajustar o endpoins pra passar
        -- qual o indicador de interesse na hr de buscar a serie
        JOIN indicador_variavel iv on IV.variavel_id = v.id AND iv.indicador_origem_id IS NULL
        JOIN indicador i on Iv.indicador_id = i.id
    WHERE
        v.id = pVariavelId;
    IF vInicio IS NULL THEN
        RETURN 'Variavel não encontrada';
    END IF;


    FOR serieRecord IN

        WITH series AS ( -- series 'base' para o calculo da Acumulada
            SELECT 'Realizado'::"Serie" as serie
            UNION ALL
            SELECT 'Previsto'::"Serie"
        )
        SELECT s.serie
        FROM series s
        WHERE
        -- filtra apenas as series do tipo escolhido para recalcular, ou todas se for null
        ((vTipoSerie is null) OR ( s.serie::text like vTipoSerie::text || '%' ))
        LOOP
            -- apaga o periodo escolhido
            DELETE FROM serie_variavel
            WHERE variavel_id = pVariavelId
                AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie";

            INSERT INTO serie_variavel(variavel_id, serie, data_valor, valor_nominal)
            WITH theData AS (
                SELECT
                    pVariavelId,
                    (serieRecord.serie::text || 'Acumulado')::"Serie",
                    gs.gs as data_serie,
                    coalesce(sum(sv.valor_nominal) OVER (order by gs.gs), vVariavelBase) as valor_acc
                FROM generate_series(
                        vInicio,
                        vFim,
                        vPeriodicidade
                ) gs
                LEFT JOIN serie_variavel sv
                    ON  sv.variavel_id = pVariavelId
                    AND data_valor = gs.gs::date
                    AND sv.serie = serieRecord.serie
            ) SELECT * from theData where theData.valor_acc is not null;

    END LOOP; -- loop resultados das series
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

