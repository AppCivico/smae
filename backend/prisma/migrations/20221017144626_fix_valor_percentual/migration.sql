BEGIN;
-- AlterTable
ALTER TABLE "indicador"
    ADD COLUMN "acumulado_valor_base" DECIMAL(65, 30);
-- AlterTable
ALTER TABLE "serie_indicador"
    DROP COLUMN "valor_percentual",
    ALTER COLUMN "valor_nominal" SET DATA TYPE DOUBLE PRECISION;
-- AlterTable
ALTER TABLE "serie_variavel"
    DROP COLUMN "valor_percentual";
CREATE OR REPLACE FUNCTION monta_formula (pIndicador_id int, pSerie "Serie", pPeriodo date)
    RETURNS varchar
    AS $$
DECLARE
    _formula varchar;
    _valores_debug json[];
    _valor numeric(95, 60);
    _referencias varchar[];
    _referencias_count int;
    r record;
BEGIN
    --
    SELECT
        formula_compilada INTO _formula
    FROM
        indicador i
    WHERE
        i.id = pIndicador_id;
    IF _formula IS NULL OR _formula = '' THEN
        RETURN NULL;
    END IF;

    -- extrai as variaveis (apenas as referencias unicas)
    WITH cte AS (
        SELECT DISTINCT unnest(regexp_matches(_formula, '\$_[0-9]{1,8}\y', 'g')) AS x
    )
    SELECT
        array_agg(replace(x, '$', '')) INTO _referencias
    FROM cte;

    SELECT count(1) into _referencias_count from indicador_formula_variavel ifv
    WHERE ifv.indicador_id = pIndicador_id AND ifv.referencia = ANY(_referencias);

    IF (_referencias_count != array_length(_referencias, 1)) THEN
        RAISE NOTICE 'Formula inválida, há referencias faltando na indicador_formula_variavel, referencias = %', _referencias::text || ', existentes ' || (
            SELECT ARRAY_AGG(referencia) from indicador_formula_variavel ifv
                WHERE ifv.indicador_id = pIndicador_id
        )::text;
        RETURN null;
    END IF;

    --
    FOR r IN
        WITH cte AS (
            SELECT
                ifv.variavel_id,
                ifv.janela,
                ifv.referencia,
                -- talvez o mais certo seja usar o periodo do indicador e não da variavel, mas estou ainda em duvida
                periodicidade_intervalo (v.periodicidade) AS periodicidade_intervalo,
                (extract(epoch FROM periodicidade_intervalo (v.periodicidade)) / 86400)::int
                    AS periodicidade_dias,
                v.casas_decimais,
                case when ifv.usar_serie_acumulada then
                    case
                        when pSerie = 'Previsto'::"Serie" then 'PrevistoAcumulado'::"Serie"
                        when pSerie = 'Realizado'::"Serie" then 'RealizadoAcumulado'::"Serie"
                        else pSerie
                    end
                else
                    pSerie
                end as serie_escolhida
            FROM
                indicador_formula_variavel ifv
                JOIN variavel v ON v.id = ifv.variavel_id
            WHERE
                ifv.indicador_id = pIndicador_id
             AND ifv.referencia = ANY(_referencias) -- carrega apenas variaveis se existir necessidade
        ) SELECT
            cte.*,
            cte.janela as registros
         FROM cte
    LOOP
        RAISE NOTICE 'ifv %', ROW_TO_JSON(r);

        IF r.janela >= 1 THEN

            SELECT
                avg(valor_nominal)
                    AS valor,
                array_agg(json_build_object('sv_data', data_valor, 'sv_valor', valor_nominal))
                    AS _valores_debug
                INTO _valor, _valores_debug
            FROM (
                SELECT
                    valor_nominal,
                    sv.data_valor
                FROM
                    serie_variavel sv
                WHERE
                    sv.serie = r.serie_escolhida
                    AND sv.variavel_id = r.variavel_id
                    AND sv.data_valor <= pPeriodo
                    AND sv.data_valor >= pPeriodo - r.periodicidade_intervalo + '1 month'::interval
                ORDER BY
                    data_valor DESC
                LIMIT (r.registros)
            ) subq;

            IF _valor IS NULL THEN
                RAISE NOTICE 'Não há valores para a referencia %', r.referencia || ' no periodo ' || pPeriodo;
                RETURN NULL;
            END IF;

            RAISE NOTICE 'resultado referencia %', r.referencia || '=' || _valor || ' valores referencia '||_valores_debug::text || ' pPeriodo=' || pPeriodo ;

            _formula := replace(_formula, '$' || r.referencia , 'round(' || _valor::text || ', ' || r.casas_decimais || ')');

        ELSEIF r.janela < 1 THEN

                SELECT
                    valor_nominal,
                    ARRAY[json_build_object('sv_data', data_valor, 'sv_valor', valor_nominal)]
                    INTO _valor, _valores_debug
                FROM
                    serie_variavel sv
                WHERE
                    sv.serie = r.serie_escolhida
                    AND sv.variavel_id = r.variavel_id
                    AND sv.data_valor >= pPeriodo - r.periodicidade_intervalo - (abs(r.janela)-1 || ' mon')::interval
                    AND sv.data_valor < pPeriodo - r.periodicidade_intervalo - (abs(r.janela)-1 || ' mon')::interval + '1 mon'::interval
                ORDER BY
                    data_valor DESC
                LIMIT 1;
            IF NOT FOUND then
                RAISE NOTICE 'Não há valores para a referencia %', r.referencia || ' no periodo ' || pPeriodo;
                return null;
            end if;

            RAISE NOTICE 'resultado referencia %', r.referencia || '=' || _valor || ' valores referencia '||_valores_debug::text || ' pPeriodo=' || pPeriodo ;

            _formula := regexp_replace(_formula, '\$' || r.referencia || '\y' , 'round(' || _valor::text || '::numeric, ' || r.casas_decimais || ')', 'g');

        END IF;

    END LOOP;
    --
    RETURN _formula;
END
$$
LANGUAGE plpgsql;
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
        CASE WHEN eh_serie_realizado IS NULL THEN
            NULL
        WHEN eh_serie_realizado THEN
            'Realizado'::"Serie"
        ELSE
            'Previsto'::"Serie"
        END AS tipo_serie,
        i.acumulado_usa_formula,
        i.acumulado_valor_base INTO vPeriodicidade,
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
    FOR serieRecord IN WITH series AS (
        SELECT
            'Realizado'::"Serie" AS serie
        UNION ALL
        SELECT
            'RealizadoAcumulado'::"Serie"
        UNION ALL
        SELECT
            'Previsto'::"Serie"
        UNION ALL
        SELECT
            'PrevistoAcumulado'::"Serie"
)
    SELECT
        s.serie
    FROM
        series s
    WHERE (
        -- nao é acumulado entao retorna
        s.serie::text NOT LIKE '%Acumulado'
        OR
        -- se é acumulado, só retorna se o indicador deseja usar a formula
        (s.serie::text LIKE '%Acumulado'
            AND vAcumuladoUsaFormula))
        AND
        -- filtra apenas as series do tipo escolhido para recalcular, ou todas se for null
        ((vTipoSerie IS NULL)
            OR (s.serie::text LIKE vTipoSerie::text || '%'))
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
            ORDER BY
                1 -- não faz diferença, mas fica melhor nos logs
                LOOP
                    resultado := NULL;
                    IF (r.formula IS NOT NULL) THEN
                        EXECUTE 'SELECT ' || r.formula INTO resultado;
                        INSERT INTO serie_indicador (indicador_id, regiao_id, serie, data_valor, valor_nominal)
                            VALUES (pIndicador_id, NULL, r.serie, r.data_serie, resultado);
                    END IF;
                    RAISE NOTICE 'r %', ROW_TO_JSON(r) || ' => ' || coalesce(resultado::text, '(null)');
                END LOOP;
                -- loop resultados da periodo da serie
                -- se não é pra usar a formula, entrao vamos recalcular automaticamente a serie acumulada usando os resultados
                IF (vAcumuladoUsaFormula = FALSE) THEN
                    -- muito arriscado fazer usando os periodos, entao recaclula tudo
                    DELETE FROM serie_indicador
                    WHERE indicador_id = pIndicador_id
                        AND serie = (serieRecord.serie::text || 'Acumulado')::"Serie"
                        AND regiao_id IS NULL;
                    INSERT INTO serie_indicador (indicador_id, regiao_id, serie, data_valor, valor_nominal)
                    WITH theData AS (
                        WITH indData AS (
                            SELECT
                                periodicidade_intervalo (i.periodicidade) AS periodicidade,
                                i.inicio_medicao AS inicio_medicao,
                                i.fim_medicao AS fim_medicao
                            FROM
                                indicador i
                            WHERE
                                i.id = pIndicador_id
)
                            SELECT
                                pIndicador_id,
                                si.regiao_id,
                                (serieRecord.serie::text || 'Acumulado')::"Serie",
                                gs.gs AS data_serie,
                                coalesce(sum(si.valor_nominal) OVER (PARTITION BY si.regiao_id ORDER BY gs.gs), vIndicadorBase) AS valor_acc
                            FROM
                                generate_series((
                                    SELECT
                                        inicio_medicao
                                    FROM indData), (
                                    SELECT
                                        fim_medicao
                                    FROM indData), (
                                    SELECT
                                        periodicidade
                                    FROM indData)) gs
                            LEFT JOIN serie_indicador si ON si.regiao_id IS NULL
                                AND si.indicador_id = pIndicador_id
                                AND data_valor = gs.gs::date
                                AND si.serie = serieRecord.serie
)
                    SELECT
                        *
                    FROM
                        theData
                WHERE
                    theData.valor_acc IS NOT NULL;
                END IF;
            END LOOP;
    -- loop resultados das series
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION busca_periodos_variavel (pVariavelId int)
    RETURNS TABLE (
        periodicidade interval,
        min date,
        max date
    )
    AS $$
BEGIN
    RETURN QUERY
    SELECT
        min(periodicidade_intervalo (i.periodicidade)),
        min(i.inicio_medicao),
        max(i.fim_medicao)
    FROM
        variavel v
        JOIN indicador_variavel iv ON IV.variavel_id = v.id
        JOIN indicador i ON Iv.indicador_id = i.id
    WHERE
        v.id = pVariavelId
    GROUP BY
        ();
END;
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
                        coalesce(sum(sv.valor_nominal) OVER (ORDER BY gs.gs), vVariavelBase) AS valor_acc
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


COMMIT;

