CREATE OR REPLACE FUNCTION monta_formula (pIndicador_id int, pSerie "Serie", pPeriodo date)
    RETURNS varchar
    AS $$
DECLARE
    _formula varchar;
    _valores_debug json[];
    _valor numeric(95, 60);
    _referencias varchar[];
    _referencias_count int;
    _ind_casas_decimais int;
    _count_conferencia int;
    _count_faltando_conferir int;
    r record;
    _p1 date;
    _p2 date;

    _formula_composta_refs int[];
    _temp_table_ref INT;
    _compiled_formula TEXT;
BEGIN
    _count_conferencia := 0;
    --
    SELECT
        formula_compilada,
        casas_decimais
        INTO _formula, _ind_casas_decimais
    FROM
        indicador i
    WHERE
        i.id = pIndicador_id;
    IF _formula IS NULL OR _formula = '' THEN
        RETURN NULL;
    END IF;

    _formula := _formula || ' ';

    WITH cte AS (
        SELECT DISTINCT sub.matches[1] AS fc_id
        FROM (SELECT regexp_matches(_formula, '@_[0-9]{1,8}', 'g') AS matches) AS sub
    )
    SELECT array_agg(replace(fc_id, '@_', '')::int)::int[] INTO _formula_composta_refs
    FROM cte;

    IF _formula_composta_refs IS NOT NULL THEN
        FOREACH _temp_table_ref IN ARRAY _formula_composta_refs
        LOOP
            -- usa o formula_compilada de cada uma delas
            SELECT NULLIF(TRIM(formula_compilada), '') INTO _compiled_formula
            FROM formula_composta
            WHERE id = _temp_table_ref;

            -- vai que tem uma formula em branco, n pode ficar um @_ solto aqui, entao vai entrar algo no lugar
            IF _compiled_formula IS NOT NULL THEN
                _formula := replace(_formula, '@_' || _temp_table_ref::text, '(' || _compiled_formula || ')');
            ELSE
                _formula := replace(_formula, '@_' || _temp_table_ref::text, '');
            END IF;

        END LOOP;
    END IF;

    -- extrai as variaveis (apenas as referencias unicas)
    WITH cte AS (
        SELECT DISTINCT unnest(regexp_matches(_formula, '\$_[0-9]{1,8}\y', 'g')) AS x
    )
    SELECT
        array_agg(replace(x, '$', '')) INTO _referencias
    FROM cte;

    SELECT count(1) into _referencias_count from view_indicador_formula_variavel_e_composta ifv
    WHERE ifv.indicador_id = pIndicador_id AND ifv.referencia = ANY(_referencias);

    --RAISE NOTICE '';
    --RAISE NOTICE '';
    --RAISE NOTICE '==> monta_formula(indicador=%', pIndicador_id::text || ', serie='||coalesce(pSerie::text, '(todas series)')||', mês = '|| pPeriodo::text || ', formula=' || _formula ||')';

    IF (_referencias_count != array_length(_referencias, 1)) THEN
        RAISE NOTICE 'Formula inválida, há referencias faltando na indicador_formula_variavel, referencias = %', _referencias::text || ', existentes ' || (
            SELECT ARRAY_AGG(referencia) from view_indicador_formula_variavel_e_composta ifv
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
                -- 2 semanas depois: ainda estou em duvida !
                periodicidade_intervalo (v.periodicidade) AS periodicidade_intervalo,
                (extract(epoch FROM periodicidade_intervalo (v.periodicidade)) / 86400 / 30)::int
                    AS periodicidade_mes,
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
                view_indicador_formula_variavel_e_composta ifv
                JOIN variavel v ON v.id = ifv.variavel_id
            WHERE
                ifv.indicador_id = pIndicador_id
             AND ifv.referencia = ANY(_referencias) -- carrega apenas variaveis se existir necessidade
        ) SELECT
            cte.*,
            (case
                when cte.janela  < cte.periodicidade_mes then 1
                when cte.janela  = cte.periodicidade_mes then cte.janela
                else floor( (cte.janela ) / cte.periodicidade_mes  )
                END
            ) as registros
         FROM cte

    LOOP
        --RAISE NOTICE 'ifv %', ROW_TO_JSON(r);
        _p1 := null;
        _p2 := null;

        IF r.janela = 1 THEN

            select
                pPeriodo,
                pPeriodo - r.periodicidade_intervalo
            into _p2, _p1;

            --RAISE NOTICE '->> buscando %', r.referencia || ' no periodo ' || pPeriodo
                    --|| ' ( data_valor > ' || _p1 || ' AND data_valor <= ' || _p2 || ' LIMIT ' || r.registros || ') - data_valor>(periodo - periodicidade) and data_valor <= periodo';

            SELECT
                avg(valor_nominal)
                    AS valor,
                array_agg(json_build_object('sv_data', data_valor, 'sv_valor', valor_nominal))
                    AS _valores_debug,
                    count(1) filter (where conferida = false)
                INTO
                _valor,
                _valores_debug,
                _count_faltando_conferir
            FROM (
                SELECT
                    valor_nominal,
                    sv.data_valor,
                    sv.conferida
                FROM
                    serie_variavel sv
                WHERE
                    sv.serie = r.serie_escolhida
                    AND sv.variavel_id = r.variavel_id
                    AND sv.data_valor <= _p2
                    AND sv.data_valor > _p1
                ORDER BY
                    data_valor DESC
                LIMIT (r.registros)
            ) subq;

            IF _valor IS NULL THEN
                --RAISE NOTICE '  <-- monta_formula retornando NULL não foram encontrado os valores';
                RETURN NULL;
            END IF;

            _count_conferencia := _count_conferencia + _count_faltando_conferir;

            --RAISE NOTICE ' <-- valor calculado %', _valor || ' valores usados ' || _valores_debug::text;

            --RAISE NOTICE '_formula %',  _formula || ' -- REPLACE A '|| r.referencia::text;

            _formula := regexp_replace(_formula, '\$' || r.referencia || '\y', 'round(' || _valor::text || ', ' || r.casas_decimais || ') ', 'g');
        ELSEIF r.janela > 1 THEN

             select
                pPeriodo,
                pPeriodo - (r.janela || ' month')::interval
            into _p2, _p1;

            --RAISE NOTICE '->> buscando %', r.referencia || ' no periodo ' || pPeriodo
                    --|| ' ( data_valor > ' || _p1 || ' AND data_valor <= ' || _p2 || ' LIMIT ' || r.registros || ') - data_valor>(periodo - meses da janela) and data_valor <= periodo';

            SELECT
                avg(valor_nominal)
                    AS valor,
                array_agg(json_build_object('sv_data', data_valor, 'sv_valor', valor_nominal))
                    AS _valores_debug,
                    count(1) filter (where conferida = false)
                INTO
                _valor,
                _valores_debug,
                _count_faltando_conferir
            FROM (
                SELECT
                    valor_nominal,
                    sv.data_valor,
                    sv.conferida
                FROM
                    serie_variavel sv
                WHERE
                    sv.serie = r.serie_escolhida
                    AND sv.variavel_id = r.variavel_id
                    AND sv.data_valor <= _p2
                    AND sv.data_valor > _p1
                ORDER BY
                    data_valor DESC
                LIMIT (r.registros)
            ) subq;

            IF _valor IS NULL THEN
                --RAISE NOTICE '  <-- monta_formula retornando NULL não foram encontrado os valores';
                RETURN NULL;
            END IF;

            _count_conferencia := _count_conferencia + _count_faltando_conferir;

            --RAISE NOTICE ' <-- valor calculado %', _valor || ' valores usados ' || _valores_debug::text;

            _formula := regexp_replace(_formula, '\$' || r.referencia || '\y' , 'round(' || _valor::text || ', ' || r.casas_decimais || ') ', 'g');

        ELSEIF r.janela < 1 THEN

                select
                    pPeriodo - ((abs(r.janela)) || ' mon')::interval - (r.periodicidade_intervalo || ' mon')::interval,
                    pPeriodo - ((abs(r.janela)) || ' mon')::interval
                    into _p1, _p2;

                --RAISE NOTICE '->> buscando %', r.referencia || ' no periodo ' || pPeriodo
                        --|| ' ( data_valor > ' || _p1 || ' AND data_valor <= ' || _p2 || ')';

                SELECT
                    valor_nominal,
                    ARRAY[json_build_object('sv_data', data_valor, 'sv_valor', valor_nominal)],
                    case when conferida = false then 1 else 0 end
                    INTO _valor, _valores_debug, _count_faltando_conferir
                FROM
                    serie_variavel sv
                WHERE
                    sv.serie = r.serie_escolhida
                    AND sv.variavel_id = r.variavel_id
                    AND sv.data_valor > _p1
                    AND sv.data_valor <= _p2
                ORDER BY
                    data_valor DESC
                LIMIT 1;
            IF NOT FOUND then
                --RAISE NOTICE ' <-- monta_formula retornando NULL não foi encontrado valores';
                return null;
            end if;

            --RAISE NOTICE 'resultado valor %',  _valor || ' valor utilizado '|| _valores_debug::text;

            _count_conferencia := _count_conferencia + _count_faltando_conferir;

            --RAISE NOTICE '_formula %',  _formula || ' -- REPLACE '|| r.referencia::text;

            _formula := regexp_replace(_formula, '\$' || r.referencia || '\y' , 'round(' || _valor::text || '::numeric, ' || r.casas_decimais || ') ', 'g');

        END IF;

    END LOOP;
    --

    --RAISE NOTICE '<== monta_formula retornando %', _formula || ' no periodo ' || pPeriodo;

    RETURN json_build_object(
        'formula', CASE WHEN _ind_casas_decimais IS NULL THEN
            _formula
        ELSE 'round(' || _formula || ', ' || _ind_casas_decimais || ')'
        END,
        'ha_conferencia_pendente', _count_conferencia > 0
        );
END
$$
LANGUAGE plpgsql;

create or replace view view_indicador_formula_variavel_e_composta AS
select indicador_id, variavel_id, janela, referencia, usar_serie_acumulada
from indicador_formula_variavel
UNION all
select ifc.indicador_id, fcv.variavel_id, fcv.janela, fcv.referencia, fcv.usar_serie_acumulada
from formula_composta_variavel fcv
join indicador_formula_composta ifc on ifc.formula_composta_id = fcv.formula_composta_id;
