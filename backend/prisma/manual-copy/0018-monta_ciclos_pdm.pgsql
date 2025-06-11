CREATE OR REPLACE FUNCTION monta_ciclos_pdm (pPdmId int, pApagarCiclo boolean)
    RETURNS varchar
    AS $$
DECLARE
    vCount int;
    vPdmInicio date;
    vPdmFim date;
    vTipo "TipoPdm";
BEGIN
    --
    SELECT
        data_inicio,
        data_fim,
        tipo
        into vPdmInicio, vPdmFim, vTipo
    FROM
        pdm
    WHERE
        id = pPdmId;

    IF (vTipo = 'PS') THEN
        RETURN 'Não existe ciclos para plano setorial';
    END IF;

    IF (vPdmInicio is null or vPdmFim is null) THEN
        RETURN 'Erro: Data de inicio/fim do PDM ainda não foram preenchidas';
    END IF;
    --
    IF (pApagarCiclo) THEN
        DELETE FROM ciclo_fisico_fase
        WHERE id IN (
                SELECT
                    fase.id
                FROM
                    ciclo_fisico_fase fase
                    JOIN ciclo_fisico cf ON cf.id = fase.ciclo_fisico_id
                WHERE
                    pdm_id = pPdmId);

        DELETE FROM ciclo_fisico
        WHERE pdm_id = pPdmId;
    END IF;
    --
    SELECT
        count(1) INTO vCount
    FROM
        ciclo_fisico
    WHERE
        pdm_id = pPdmId;
    --
    IF (vCount > 0) THEN
        RETURN 'Erro: Os ciclos já foram iniciados no PDM, não é mais possível recalcular o sistema sem apagar os ciclos';
    END IF;
    --
    WITH ciclo_fases AS (
        SELECT
            ciclo_fase,
            gs::date AS data_ciclo,
            (gs.gs::date + (n_dias_do_inicio_mes || 'days')::interval)::date AS inicio,
            (
                CASE WHEN duracao >= 0 THEN
                    gs.gs::date + (n_dias_do_inicio_mes || 'days')::interval + (duracao - 1 || 'days')::interval
                ELSE
                    gs.gs::date + '1 month'::interval + (duracao || 'days')::interval
                END)::date AS fim
        FROM
            generate_series(date_trunc('month', vPdmInicio), date_trunc('month', vPdmFim), '1 month'::interval) gs
        CROSS JOIN (
            SELECT
                base.ciclo_fase,
                coalesce(pc.n_dias_do_inicio_mes, base.n_dias_do_inicio_mes) AS n_dias_do_inicio_mes,
            coalesce(pc.duracao, base.duracao) AS duracao
        FROM
            ciclo_fases_base base
            LEFT JOIN ciclo_fases_pdm_config pc ON pdm_id = pPdmId
                AND base.ciclo_fase = pc.ciclo_fase) AS sub
    ),
    dt_ciclo_fisicos AS (
        SELECT
            data_ciclo,
            'Coleta'::"CicloFase" AS ciclo_fase_atual
        FROM
            ciclo_fases
    GROUP BY
        1
    ORDER BY
        1
    ),
    ciclo_fisicos_registros AS (
    INSERT INTO ciclo_fisico (pdm_id, ativo, data_ciclo)
        SELECT
            pPdmId,
            FALSE,
            data_ciclo
        FROM
            dt_ciclo_fisicos
        RETURNING
            id,
            data_ciclo
    ),
    ciclo_fisicos_fases AS (
    INSERT INTO ciclo_fisico_fase (ciclo_fisico_id, data_inicio, data_fim, ciclo_fase)
        SELECT
            id,
            inicio,
            fim,
            cf.ciclo_fase
        FROM
            ciclo_fisicos_registros cfr
            JOIN ciclo_fases cf ON cf.data_ciclo = cfr.data_ciclo
        RETURNING
            id
    )
    SELECT
        count(id) INTO vCount
    FROM
        ciclo_fisicos_fases;

    update ciclo_fisico
    set acordar_ciclo_em = now()
    where pdm_id = pPdmId
    AND data_ciclo = date_trunc('month', now() at time zone 'America/Sao_Paulo');
    --
    RETURN vCount || ' ciclo fases inseridos';
EXCEPTION WHEN OTHERS THEN
    return 'Erro: não é mais possível apagar o ciclo, já existem objetos associados';
END
$$
LANGUAGE plpgsql;

