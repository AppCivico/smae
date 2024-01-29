CREATE OR REPLACE FUNCTION atualiza_meta_status_consolidado(pMetaId int, pCicloFisicoIdAtual int)
    RETURNS varchar
    AS $$
DECLARE

v_pdm_id int;

v_data_ciclo date;
v_variaveis_total int[];
v_variaveis_preenchidas int[];
v_variaveis_enviadas int[];
v_variaveis_conferidas int[];
--v_variaveis_aguardando_cp int[];
v_variaveis_aguardando_complementacao int[];

v_fase "CicloFase";

v_analise_qualitativa_enviada BOOLEAN;
v_risco_enviado BOOLEAN;
v_fechamento_enviado BOOLEAN;
v_pendente_cp BOOLEAN;

--v_default_aguarda_cp BOOLEAN;

v_debug varchar;

vCronograma int[];
v_cronograma_total int[];
v_cronograma_atraso_ini int[];
v_cronograma_atraso_fim int[];
v_dont_care int;
v_orcamento_pendente BOOLEAN;

v_orc_total int[];
v_orc_preenchido int[];

BEGIN
    v_debug := '';

    SELECT
        cf.pdm_id, cfs.ciclo_fase, cf.data_ciclo
            INTO
        v_pdm_id, v_fase, v_data_ciclo
    FROM
         ciclo_fisico cf
     JOIN ciclo_fisico_fase cfs on cfs.id = cf.ciclo_fase_atual_id
     WHERE cf.id = pCicloFisicoIdAtual
     AND ativo
    LIMIT 1;

    v_debug := v_debug || ' fase=' || v_fase;
--
    if (v_pdm_id is null) then
        delete from meta_status_consolidado_cf where meta_id = pMetaId;
        RETURN 'sem cf';
    end if;

    --v_default_aguarda_cp := v_fase IN ('Analise', 'Risco', 'Fechamento');

    --
    with cte_variaveis as (
        select
            iv.variavel_id,
            iv.indicador_id,
            v.atraso_meses * '-1 month'::interval as atraso,
             -- campo que tem sentido/valor apenas para os usuarios do ponto_focal
             -- não pode ser usado para calculcar nada do ponto_focal, pois as pendencias
             -- dele (eg: falta conferir algo) não devem influenciar esse campo, fica sempre 'aguardando o cp'
             -- na visão do ponto-focal
             -- eu acho que não vamos precisar dela, vou deixar comentado
            --coalesce(svcf.aguarda_cp, v_default_aguarda_cp) as aguarda_cp,
            coalesce(svcf.aguarda_complementacao, false) as aguarda_complementacao,

            case when v_fase = 'Coleta' then
                svcf.id is not null
            ELSE true END AS enviada,
            svcf.conferida

        from mv_variavel_pdm iv
        join variavel v on v.id = iv.variavel_id
        left join status_variavel_ciclo_fisico svcf ON svcf.variavel_id = v.id
            AND svcf.ciclo_fisico_id = pCicloFisicoIdAtual
        where iv.meta_id = pMetaId and iv.pdm_id = v_pdm_id
    ),
    cte_variaveis_preenchidas as (
        select
            v.variavel_id,
            sv.conferida as conferida_com_valor
        from cte_variaveis v
        join serie_variavel sv on sv.variavel_id = v.variavel_id and sv.serie = 'Realizado'
            and sv.data_valor = v_data_ciclo + v.atraso
    )
    select
        coalesce(array_agg(v.variavel_id), '{}'::int[]) as v_total,
        coalesce((select array_agg(variavel_id) from cte_variaveis_preenchidas), '{}'::int[]) as v_variaveis_preenchidas,
        coalesce(array_agg(v.variavel_id) filter (where enviada), '{}'::int[]) as v_enviada,
        coalesce(
                (
                    select array_agg(variavel_id) from (
                        select me.variavel_id from cte_variaveis_preenchidas me where me.conferida_com_valor
                            UNION -- não muda pra union all, deixa com union pra fazer o distinct
                        select me.variavel_id from cte_variaveis me where me.conferida
                ) x
        ), '{}'::int[]) as v_variaveis_conferidas,
        --coalesce( array_agg(v.variavel_id) filter (where aguarda_cp) , '{}'::int[]) as v_aguarda_cp,
        coalesce( array_agg(v.variavel_id) filter (where aguarda_complementacao) , '{}'::int[]) as v_aguarda_complementacao

            INTO

        v_variaveis_total,
        v_variaveis_preenchidas,
        v_variaveis_enviadas,
        v_variaveis_conferidas,
        --v_variaveis_aguardando_cp,
        v_variaveis_aguardando_complementacao
    from cte_variaveis v;

    select 1 = (
            select count(1)
            from meta_ciclo_fisico_analise mcfa
            where mcfa.removido_em is null
            and mcfa.ultima_revisao
            and mcfa.meta_id = pMetaId
            and ciclo_fisico_id = pCicloFisicoIdAtual
    ) into v_analise_qualitativa_enviada;

    select 1 = (
            select count(1)
            from meta_ciclo_fisico_risco mcfr
            where mcfr.removido_em is null
            and mcfr.ultima_revisao
            and mcfr.meta_id = pMetaId
            and ciclo_fisico_id = pCicloFisicoIdAtual
    ) into v_risco_enviado;

    select 1 = (
            select count(1)
            from meta_ciclo_fisico_fechamento mcff
            where mcff.removido_em is null
            and mcff.ultima_revisao
            and mcff.meta_id = pMetaId
            and ciclo_fisico_id = pCicloFisicoIdAtual
    ) into v_fechamento_enviado;

    -- Redefinir variáveis se não estiver na fase correspondente
    IF v_fase NOT IN ('Analise', 'Risco', 'Fechamento') THEN
        v_analise_qualitativa_enviada := null;
    END IF;

    IF v_fase NOT IN ('Risco', 'Fechamento') THEN
        v_risco_enviado := null;
    END IF;

    IF v_fase NOT IN ('Fechamento') THEN
        v_fechamento_enviado := null;
    END IF;

    v_pendente_cp := false;

    IF (v_fase != 'Coleta' AND (
               (v_fase = 'Fechamento' AND COALESCE(v_fechamento_enviado, false) = false)
            OR (v_fase IN ('Risco', 'Fechamento') AND COALESCE(v_risco_enviado, false) = false)
            OR (v_fase IN ('Analise', 'Risco', 'Fechamento') AND COALESCE(v_analise_qualitativa_enviada, false) = false)
        )
    ) THEN
        v_pendente_cp := true;
    END IF;

    -- faz o check mais "pesado"
    if (v_fase != 'Coleta' AND NOT v_pendente_cp) THEN

        v_pendente_cp = NOT ARRAY(
            SELECT unnest(v_variaveis_total)
                EXCEPT
            SELECT unnest(v_variaveis_conferidas)
        ) = ARRAY[]::int[];

    END IF;


    select array_agg(cronograma_id) into vCronograma
    from view_meta_cronograma
    where meta_id = pMetaId;

    WITH tmp_data AS (
        select
            e.id,
            case
                when inicio_previsto < now() and inicio_real is null then 1
                when termino_previsto < now() and termino_real is null then 2
            else 0
            end as status
        from etapa e
        join (
            select b.id, (select count(1) from etapa x where x.etapa_pai_id = b.id and x.removido_em is null) as filhos
            from  cronograma_etapa a
            join etapa b on b.id = a.etapa_id and b.removido_em is null
            where a.cronograma_id = ANY(vCronograma) and a.inativo = false
            and b.etapa_pai_id is null

                  union all

            select fase.id, (select count(1) from etapa x where x.etapa_pai_id = fase.id and x.removido_em is null) as filhos
            from  cronograma_etapa a
            join etapa e on e.id = a.etapa_id and e.removido_em is null
            join etapa fase on fase.etapa_pai_id = e.id and fase.removido_em is null
            where a.cronograma_id = ANY(vCronograma) and a.inativo = false
            and e.etapa_pai_id is null

                union all

            select subfase.id, (select count(1) from etapa x where x.etapa_pai_id = subfase.id and x.removido_em is null) as filhos
            from  cronograma_etapa a
            join etapa e on e.id = a.etapa_id and e.removido_em is null
            join etapa fase on fase.etapa_pai_id = e.id and fase.removido_em is null
            join etapa subfase on subfase.etapa_pai_id = fase.id and subfase.removido_em is null
            where a.cronograma_id = ANY(vCronograma) and a.inativo = false
            and e.etapa_pai_id is null

        ) sub on sub.id = e.id and sub.filhos = 0
    )
    select
        array_agg(e.id) as total,
        array_agg(e.id) filter (where "status" = 1) as atraso_inicio,
        array_agg(e.id) filter (where "status" = 2) as atraso_fim
            into
        v_cronograma_total,
        v_cronograma_atraso_ini,
        v_cronograma_atraso_fim
    from (select distinct x.id, x.status from tmp_data x) e;

    WITH cte_execucao_concluida AS (
      SELECT
        ano_referencia,
        CASE
          -- se já passou 1 ano, considera que só 1 registro como concluido já ta ok
          WHEN ano_referencia < EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') THEN 1
          -- se o ano for igual, o ano interior precisa de um registro nos últimos 3 meses (dezembro, por exemplo fica ok até março)
          WHEN ano_referencia = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') THEN
            CASE
              WHEN EXISTS (
                SELECT 1
                FROM pdm_orcamento_realizado_config
                WHERE ano_referencia = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') - 1
                  AND atualizado_em >= (CURRENT_DATE - INTERVAL '3 months')::date
                  AND ultima_revisao = true
                  AND execucao_concluida = true
                  AND meta_id = pMetaId
              ) THEN 1
              WHEN EXISTS (
                SELECT 1
                FROM pdm_orcamento_realizado_config
                WHERE ano_referencia = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
                  AND atualizado_em < (CURRENT_DATE - INTERVAL '3 months')::date
                  AND ultima_revisao = true
                  AND execucao_concluida = true
                  AND meta_id = pMetaId
              ) THEN 1
              ELSE 0
            END
          ELSE 0
        END AS executado
      FROM pdm_orcamento_realizado_config
      WHERE meta_id = pMetaId
      AND ultima_revisao = true
      AND execucao_concluida = true
    ),
    cte_calc AS (
      SELECT
        p.ano_referencia,
        COALESCE(ec.executado, 0) AS executado
      FROM (
         -- todos os anos do PDM, menos os futuros
        SELECT
            extract('year' from gs.gs::date) as ano_referencia
        FROM pdm x
        JOIN meta b ON b.pdm_id = x.id AND b.id = pMetaId
        CROSS JOIN generate_series( x.data_inicio, x.data_fim, '1 year'::interval) gs
        WHERE extract('year' from gs.gs::date) <= EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
      ) p
      LEFT JOIN cte_execucao_concluida ec ON p.ano_referencia = ec.ano_referencia
    )
    select
      coalesce(array_agg(ano_referencia), '{}'::int[]) as total,
      coalesce(array_agg(ano_referencia) filter (where executado=1), '{}'::int[]) as orcamento_preenchido
        into
      v_orc_total,
      v_orc_preenchido
    from cte_calc;

    v_orcamento_pendente = NOT ARRAY(
        SELECT unnest(v_orc_total)
            EXCEPT
        SELECT unnest(v_orc_preenchido)
    ) = ARRAY[]::int[];

    IF (v_orcamento_pendente) THEN
        v_pendente_cp := true;
    END IF;

    --
    delete from meta_status_consolidado_cf where meta_id = pMetaId;
    --

    insert into meta_status_consolidado_cf (
        meta_id,
        ciclo_fisico_id,
        variaveis_total,
        variaveis_preenchidas,
        variaveis_enviadas,
        variaveis_conferidas,
        variaveis_aguardando_complementacao,
        cronograma_total,
        cronograma_atraso_fim,
        cronograma_atraso_inicio,
        orcamento_total,
        orcamento_preenchido,

        analise_qualitativa_enviada,
        risco_enviado,
        fechamento_enviado,

        pendente_cp,
        orcamento_pendente,

        atualizado_em

    ) values (
        pMetaId,
        pCicloFisicoIdAtual,
        v_variaveis_total,
        v_variaveis_preenchidas,
        v_variaveis_enviadas,
        v_variaveis_conferidas,
        v_variaveis_aguardando_complementacao,
        v_cronograma_total,
        v_cronograma_atraso_ini,
        v_cronograma_atraso_fim,
        v_orc_total,
        v_orc_preenchido,
        v_analise_qualitativa_enviada,
        v_risco_enviado,
        v_fechamento_enviado,

        v_pendente_cp,
        v_orcamento_pendente,

        now()
    );
    --
    -- calculando atrasados
    --

    DELETE FROM meta_status_atraso_consolidado_mes WHERE meta_id = pMetaId;
    DELETE FROM meta_status_atraso_variavel WHERE meta_id = pMetaId;

    WITH foreseen as (
        SELECT sv.variavel_id, sv.data_valor, mvp.meta_id
        FROM serie_variavel sv
        JOIN mv_variavel_pdm mvp ON sv.variavel_id = mvp.variavel_id
        JOIN variavel v on v.id = sv.variavel_id
        WHERE sv.serie = 'PrevistoAcumulado' AND mvp.meta_id = pMetaId
        and sv.data_valor < date_trunc('month', (now() - ( v.atraso_meses || ' month')::interval) at time zone 'America/Sao_Paulo')
    ), late_vars as (
        SELECT p.variavel_id, p.data_valor, p.meta_id
        FROM foreseen p
        LEFT JOIN serie_variavel sv ON sv.data_valor = p.data_valor AND p.variavel_id = sv.variavel_id
            AND sv.serie='Realizado'
            AND sv.conferida = TRUE

        WHERE sv.id IS NULL
    ), late_per_month as (
        select
            meta_id, data_valor, count(1) as qtde
        from late_vars
        group by 1, 2
    ),
    late_per_month_orc as (
        select
            data_valor, 1 as qtde_orcamento
        from (
            select (unnest(orcamento_total)::text || '-01-01')::date as data_valor
            from meta_status_consolidado_cf cf where cf.meta_id = pMetaId
                    EXCEPT
            select (unnest(orcamento_preenchido)::text || '-01-01')::date as data_valor
            from meta_status_consolidado_cf cf where cf.meta_id = pMetaId
        ) subq
    ),
    late_per_month_joined as (
        SELECT
            pMetaId as meta_id,
            COALESCE(cte1.data_valor, cte2.data_valor) AS data_valor,
            COALESCE(cte1.qtde, 0) AS qtde,
            COALESCE(cte2.qtde_orcamento, 0) AS qtde_orcamento
        FROM late_per_month cte1
        FULL OUTER JOIN late_per_month_orc cte2 ON cte1.data_valor = cte2.data_valor
    ),
    late_per_var as (
        select
            meta_id, variavel_id, array_agg(data_valor ORDER BY data_valor) as meses
        from late_vars
        group by 1, 2
    ),
    insert_per_month AS (
        insert into meta_status_atraso_consolidado_mes (meta_id, mes, variaveis_atrasadas, orcamento_atrasados)
        select
            x.meta_id, x.data_valor, x.qtde, x.qtde_orcamento
        from late_per_month_joined x
    ),
    insert_per_var AS (
        insert into meta_status_atraso_variavel (meta_id, variavel_id, meses_atrasados)
        select
            x.meta_id, x.variavel_id, x.meses
        from late_per_var x
    )
    select 1 into v_dont_care;

    --
    RETURN v_debug;
END
$$
LANGUAGE plpgsql;


--select atualiza_meta_status_consolidado(202, (select id from ciclo_fisico where ativo));
--select * from meta_status_consolidado_cf where meta_id=202;
