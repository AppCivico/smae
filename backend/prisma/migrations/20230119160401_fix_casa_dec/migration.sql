
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
                ;

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
                        RAISE NOTICE ' RESULTADO NULO %', ROW_TO_JSON(r) || ' => ' || coalesce(resultado::text, '(null)');
                    END IF;
                END IF;

                RAISE NOTICE 'r %', ROW_TO_JSON(r) || ' => ' || coalesce(resultado::text, '(null)');
            END LOOP; -- loop resultados da periodo da serie

        -- se não é pra usar a formula, entrao vamos recalcular automaticamente a serie acumulada usando os resultados
        IF (vAcumuladoUsaFormula = false) THEN
            -- muito arriscado fazer usando os periodos, entao recaclula tudo
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
                    coalesce(sum(si.valor_nominal::numeric) OVER (order by gs.gs), case when serieRecord.serie = 'Realizado'::"Serie" then null else vIndicadorBase end) as valor_acc,
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

        END IF ;
    END LOOP; -- loop resultados das series
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

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



select monta_serie_acumulada(id, null) from variavel;
select monta_serie_indicador(id, null, null, null) from indicador;
