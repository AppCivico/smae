-- AlterTable
ALTER TABLE "indicador" ADD COLUMN     "formula_compilada" TEXT;

-- CreateIndex
CREATE INDEX "idx_serie_variavel_variavel_id_data_valor" ON "serie_variavel"("serie", "variavel_id", "data_valor");

CREATE OR REPLACE FUNCTION periodicidade_intervalo (p "Periodicidade")
    RETURNS interval
    LANGUAGE SQL
    AS $$
    SELECT
        CASE WHEN p = 'Mensal' THEN
            '1 month'::interval
        WHEN p = 'Bimestral' THEN
            '2 month'::interval
        WHEN p = 'Trimestral' THEN
            '3 month'::interval
        WHEN p = 'Quadrimestral' THEN
            '4 month'::interval
        WHEN p = 'Semestral' THEN
            '6 month'::interval
        WHEN p = 'Anual' THEN
            '1 year'::interval
        WHEN p = 'Quinquenal' THEN
            '5 year'::interval
        WHEN p = 'Secular' THEN
            '10 year'::interval
        ELSE
            NULL
        END;
$$;

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
        SELECT DISTINCT unnest(regexp_matches(_formula, '\$[A-Z]+\y', 'g')) AS x
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
                v.casas_decimais
            FROM
                indicador_formula_variavel ifv
                JOIN variavel v ON v.id = ifv.variavel_id
            WHERE
                ifv.indicador_id = pIndicador_id
             AND ifv.referencia = ANY(_referencias) -- carrega apenas variaveis se existir necessidade
        ) SELECT
            cte.*,
            CASE WHEN (cte.janela < cte.periodicidade_dias) THEN
                1
            WHEN cte.janela = cte.periodicidade_dias THEN
                cte.janela
            ELSE
                floor(cte.janela / cte.periodicidade_dias)
            END as registros
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
                    sv.serie = pSerie
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
                    sv.serie = pSerie
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

            _formula := regexp_replace(_formula, '\$' || r.referencia || '\y' , 'round(' || _valor::text || ', ' || r.casas_decimais || ')', 'g');

        END IF;

    END LOOP;
    --
    RETURN _formula;
END
$$
LANGUAGE plpgsql;
