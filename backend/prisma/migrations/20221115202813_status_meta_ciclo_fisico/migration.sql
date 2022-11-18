
truncate status_meta_ciclo_fisico;

ALTER TABLE "status_meta_ciclo_fisico" DROP COLUMN "status_valido",
ADD COLUMN     "pessoa_id" INTEGER NOT NULL;
CREATE OR REPLACE FUNCTION atualiza_status_meta_pessoa (pMetaId int, pPessoaId int, pCicloFisicoIdAtual int)
    RETURNS varchar
    AS $$
DECLARE

vDataCicloCorrente date;
vPerfil varchar;
vAtrasadaCount int;
vStatusColeta varchar;

BEGIN
    -- recebe o pdm_id apenas pq já está calculado no GET pra não ter que buscar novamente pelo ativo aqui dentro
    delete from status_meta_ciclo_fisico where pessoa_id = pPessoaId and meta_id = pMetaId;

SELECT
        cf.data_ciclo INTO vDataCicloCorrente
    FROM
         ciclo_fisico cf  where cf.id = pCicloFisicoIdAtual
    LIMIT 1;

    with perfil as (select perfil from pessoa_acesso_pdm where pessoa_id = pPessoaId),
    variaveis_atrasadas as (
        -- se por acaso, a variavel não valida nunca participou do ciclo, não vai ter status
        -- logo ela não vai ter valor e portanto não vai contar como atrasada
        -- (então fica como TODO, assim que o admin criar uma nova o sistema vai precisar inserir uma linha
        -- com o valor conferida=false nessa tabela, e a mesma coisa quando colocar o valor, já colocar conferida=true se alterar os valores)
        -- iria ficar lento demais buscar todas as variaveis da meta, calcular todos os periodos que participam
        -- depois buscar se existe a informação que ta conferida aqui
        select count(1) as variaveis_atrasadas
        from status_variavel_ciclo_fisico svcf
        join ciclo_fisico cf on cf.id = svcf.ciclo_fisico_id and cf.data_ciclo < vDataCicloCorrente
        where (select perfil from perfil) IN ('admin_cp', 'tecnico_cp')
        and svcf.meta_id = pMetaId
        and svcf.conferida = false
    )
    select perfil, variaveis_atrasadas
    into vPerfil, vAtrasadaCount
    from perfil, variaveis_atrasadas;

    IF (vAtrasadaCount > 0) THEN
        vStatusColeta = 'Variaveis atrasadas';
    ELSE


        with
        variaveis_visiveis as (
            select vpdm.id as variavel_id
            from variavel vpdm
            cross join (select variaveis from pessoa_acesso_pdm where pessoa_id = 1) v
            where vpdm.id = any(v.variaveis)
        ), variaveis as (
            select
                iv.variavel_id as variavel_id
            from meta m
            join indicador i on  i.meta_id = m.id
            join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
            where iv.variavel_id in (
                select variavel_id from variaveis_visiveis
            ) and m.removido_em is null and m.ativo = TRUE
            and m.id = pMetaId
                UNION ALL
            select
                iv.variavel_id as variavel_id
            from meta m
            join iniciativa _i on _i.meta_id = m.id
            join indicador i on  i.iniciativa_id = _i.id
            join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
            where iv.variavel_id in (
                select variavel_id from variaveis_visiveis
            ) and m.removido_em is null and m.ativo = TRUE
            and m.id = pMetaId
                UNION ALL
            select
                iv.variavel_id as variavel_id
            from meta m
            join iniciativa _i on _i.meta_id = m.id
            join atividade _a on _a.iniciativa_id = _i.id
            join indicador i on  i.atividade_id = _a.id
            join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
            where iv.variavel_id in (
                select variavel_id from variaveis_visiveis
            ) and m.removido_em is null and m.ativo = TRUE
            and m.id = pMetaId
        ),
        counts as (
            select
                count(1) filter (where s.conferida) as conferidas,
                count(1) filter (where s.aguarda_complementacao) as aguarda_complementacao,
                count(1) filter (where s.aguarda_cp) as aguarda_cp,
                count(1) as total
            from variaveis v
            left join status_variavel_ciclo_fisico s on   s.meta_id = pMetaId
            and s.ciclo_fisico_id = pCicloFisicoIdAtual
            and s.variavel_id = v.variavel_id
        )
        select
            case when total = conferidas then 'Todas conferidas'
            when aguarda_complementacao > 0 then 'Aguardando complementação'
            when aguarda_cp = total then 'Aguardando conferencia'
            else
                case when vPerfil = 'ponto_focal' then 'Não atualizadas' else 'Aguardando conferencia' end
            end
            into vStatusColeta
        from counts;


    END IF;


    insert into status_meta_ciclo_fisico (meta_id, pessoa_id, ciclo_fisico_id, status_coleta, status_cronograma)
    select pMetaId, pPessoaId, pCicloFisicoIdAtual, vStatusColeta, 'todo-'||random()::text;


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
        periodicidade_intervalo (v.periodicidade),
        coalesce(v.inicio_medicao, i.inicio_medicao),
        coalesce(v.fim_medicao, i.fim_medicao)
    FROM
        variavel v
        JOIN indicador_variavel iv ON IV.variavel_id = v.id and iv.desativado_em is null and iv.indicador_origem_id is null
        JOIN indicador i ON Iv.indicador_id = i.id
    WHERE
        v.id = pVariavelId;
END;
$$
LANGUAGE plpgsql STABLE;



CREATE TRIGGER trg_indicador_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON indicador
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();


drop trigger trg_meta_responsavel_recalc_pessoa on meta ;

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

    -- extrai as variaveis (apenas as referencias unicas)
    WITH cte AS (
        SELECT DISTINCT unnest(regexp_matches(_formula, '\$_[0-9]{1,8}\y', 'g')) AS x
    )
    SELECT
        array_agg(replace(x, '$', '')) INTO _referencias
    FROM cte;

    SELECT count(1) into _referencias_count from indicador_formula_variavel ifv
    WHERE ifv.indicador_id = pIndicador_id AND ifv.referencia = ANY(_referencias);

    RAISE NOTICE '';
    RAISE NOTICE '';
    RAISE NOTICE '==> monta_formula(indicador=%', pIndicador_id::text || ', serie='||coalesce(pSerie::text, '(todas series)')||', mês = '|| pPeriodo::text || ', formula=' || _formula ||')';

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
                indicador_formula_variavel ifv
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
        RAISE NOTICE 'ifv %', ROW_TO_JSON(r);
        _p1 := null;
        _p2 := null;

        IF r.janela = 1 THEN

            select
                pPeriodo,
                pPeriodo - r.periodicidade_intervalo
            into _p2, _p1;

            RAISE NOTICE '->> buscando %', r.referencia || ' no periodo ' || pPeriodo
                    || ' ( data_valor > ' || _p1 || ' AND data_valor <= ' || _p2 || ' LIMIT ' || r.registros || ') - data_valor>(periodo - periodicidade) and data_valor <= periodo';

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
                RAISE NOTICE '  <-- monta_formula retornando NULL não foram encontrado os valores';
                RETURN NULL;
            END IF;

            _count_conferencia := _count_conferencia + _count_faltando_conferir;

            RAISE NOTICE ' <-- valor calculado %', _valor || ' valores usados ' || _valores_debug::text;

            _formula := replace(_formula, '$' || r.referencia , 'round(' || _valor::text || ', ' || r.casas_decimais || ')');
        ELSEIF r.janela >= 1 THEN

             select
                pPeriodo,
                pPeriodo - (r.janela || ' month')::interval
            into _p2, _p1;

            RAISE NOTICE '->> buscando %', r.referencia || ' no periodo ' || pPeriodo
                    || ' ( data_valor > ' || _p1 || ' AND data_valor <= ' || _p2 || ' LIMIT ' || r.registros || ') - data_valor>(periodo - meses da janela) and data_valor <= periodo';

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
                RAISE NOTICE '  <-- monta_formula retornando NULL não foram encontrado os valores';
                RETURN NULL;
            END IF;

            _count_conferencia := _count_conferencia + _count_faltando_conferir;

            RAISE NOTICE ' <-- valor calculado %', _valor || ' valores usados ' || _valores_debug::text;

            _formula := replace(_formula, '$' || r.referencia , 'round(' || _valor::text || ', ' || r.casas_decimais || ')');

        ELSEIF r.janela < 1 THEN

                select
                    pPeriodo - ((abs(r.janela)) || ' mon')::interval - (r.periodicidade_intervalo || ' mon')::interval,
                    pPeriodo - ((abs(r.janela)) || ' mon')::interval
                    into _p1, _p2;

                RAISE NOTICE '->> buscando %', r.referencia || ' no periodo ' || pPeriodo
                        || ' ( data_valor > ' || _p1 || ' AND data_valor <= ' || _p2 || ')';

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
                RAISE NOTICE ' <-- monta_formula retornando NULL não foi encontrado valores';
                return null;
            end if;

            RAISE NOTICE 'resultado valor %',  _valor || ' valor utilizado '|| _valores_debug::text;

            _count_conferencia := _count_conferencia + _count_faltando_conferir;

            _formula := regexp_replace(_formula, '\$' || r.referencia || '\y' , 'round(' || _valor::text || '::numeric, ' || r.casas_decimais || ')', 'g');

        END IF;

    END LOOP;
    --

    RAISE NOTICE '<== monta_formula retornando %', _formula || ' no periodo ' || pPeriodo;

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

                    INSERT INTO serie_indicador (indicador_id, serie, data_valor, valor_nominal, ha_conferencia_pendente)
                        VALUES (pIndicador_id, r.serie, r.data_serie, resultado, r.ha_conferencia_pendente);
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
                    coalesce(sum(si.valor_nominal) OVER (order by gs.gs), case when serieRecord.serie = 'Realizado'::"Serie" then null else vIndicadorBase end) as valor_acc,
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



