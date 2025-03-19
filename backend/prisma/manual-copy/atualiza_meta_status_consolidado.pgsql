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
v_pendente_cp_variavel BOOLEAN;
v_pendente_cp_cronograma BOOLEAN;

--v_default_aguarda_cp BOOLEAN;

v_debug varchar;
v_tipo "TipoPdm";

vCronograma int[];
v_cronograma_total int[];
v_cronograma_atraso_ini int[];
v_cronograma_atraso_fim int[];
v_orcamento_pendentes int[];
v_dont_care int;
v_orcamento_pendente BOOLEAN;

v_tmp BOOLEAN;
v_orc_total int[];
v_orc_preenchido int[];

BEGIN
    PERFORM pg_advisory_xact_lock(pMetaId);

    v_debug := '';

    if (pMetaId is null) then
        RETURN 'meta_id is required!';
    end if;

    -- todo pegar a fase da meta
    SELECT
        cf.pdm_id, cfs.ciclo_fase, cf.data_ciclo, p.tipo
            INTO
        v_pdm_id, v_fase, v_data_ciclo, v_tipo
    FROM
         ciclo_fisico cf
     LEFT JOIN ciclo_fisico_fase cfs on cfs.id = cf.ciclo_fase_atual_id
     JOIN pdm p ON p.id = cf.pdm_id
     JOIN meta m ON m.pdm_id = p.id
     WHERE cf.id = pCicloFisicoIdAtual
     AND m.id = pMetaId
     AND cf.ativo
     LIMIT 1;

    -- Se o tipo do PDM for diferente de PDM, atualiza o consolidado do PS
    IF (v_tipo != 'PDM') THEN
        RETURN refresh_ps_meta_consolidado(pMetaId);
    END IF;

    IF (v_fase is null) THEN
        RETURN 'ciclo do PDM está sem fase';
    END IF;

    SELECT coalesce(cfs.ciclo_fase, v_fase) INTO v_fase
    FROM meta m
    LEFT JOIN ciclo_fisico_fase cfs on cfs.id = m.ciclo_fase_id
    WHERE m.id = pMetaId;

    v_debug := v_debug || ' fase=' || v_fase;
--
    if (v_pdm_id is null) then
        DELETE FROM meta_status_consolidado_cf WHERE meta_id = pMetaId;
        DELETE FROM meta_status_atraso_consolidado_mes WHERE meta_id = pMetaId;
        DELETE FROM meta_status_atraso_variavel WHERE meta_id = pMetaId;
        RETURN v_debug || ' sem cf';
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
        AND v.mostrar_monitoramento = true
        AND v.suspendida_em IS NULL
        -- antes era feito pelo join, mas isso não é OK em situações como a variaveis categorizadas não tem series
        -- de previsto acumulado, então não tem como fazer o join, mas ela participa do ciclo
        -- PS: Ainda fica o bug de precisar limpar da serie_variavel quando troca a data da variavel no PDM (PS não tem como)
        --join serie_variavel sv on sv.variavel_id = v.id and sv.serie = 'PrevistoAcumulado'
        --    and sv.data_valor = v_data_ciclo + (v.atraso_meses * '-1 month'::interval)
        AND variavel_participa_do_ciclo(v.id, (v_data_ciclo - (v.atraso_meses || ' months')::interval)::date) = TRUE
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

    v_variaveis_enviadas = ARRAY(
        SELECT unnest(v_variaveis_enviadas)
            EXCEPT
        SELECT unnest(v_variaveis_aguardando_complementacao)
    );

    v_variaveis_preenchidas = ARRAY(
        SELECT unnest(v_variaveis_preenchidas)
            EXCEPT
        SELECT unnest(v_variaveis_aguardando_complementacao)
    );

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
    v_pendente_cp_cronograma := false;
    v_pendente_cp_variavel := false;

    IF (v_fase != 'Coleta' AND (
               (v_fase = 'Fechamento' AND COALESCE(v_fechamento_enviado, false) = false)
            OR (v_fase IN ('Risco', 'Fechamento') AND COALESCE(v_risco_enviado, false) = false)
            OR (v_fase IN ('Analise', 'Risco', 'Fechamento') AND COALESCE(v_analise_qualitativa_enviada, false) = false)
        )
    ) THEN
        v_pendente_cp := true;
        v_pendente_cp_variavel := true; -- considerar pendencias nesses itens como variaveis
        v_debug := v_debug || ' meta status v_pendente_cp=' || v_pendente_cp;
    END IF;

    -- faz o check mais "pesado"
    if (v_fase != 'Coleta' AND NOT v_pendente_cp) THEN

        v_tmp = NOT ARRAY(
            SELECT unnest(v_variaveis_total)
                EXCEPT
            SELECT unnest(v_variaveis_conferidas)
        ) = ARRAY[]::int[];

        v_pendente_cp := v_tmp;
        v_pendente_cp_variavel := v_tmp;

        v_debug := v_debug || ' variavel v_variaveis_total v_pendente_cp=' || v_pendente_cp;

    END IF;

    if (v_fase = 'Coleta' AND NOT v_pendente_cp) THEN
        v_tmp = NOT ARRAY(
            SELECT unnest(v_variaveis_enviadas)
                EXCEPT
            SELECT unnest(v_variaveis_conferidas)
        ) = ARRAY[]::int[];

        v_pendente_cp := v_tmp;
        v_pendente_cp_variavel := v_tmp;

        v_debug := v_debug || ' variavel v_variaveis_enviadas v_pendente_cp=' || v_pendente_cp;
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
          -- todos os órgãos responsáveis da meta precisam estar concluídos

          -- aqui como provavelmente não vamos ter mais ciclos de orçamento
          -- então só vai ter como editar o concluido no periodo "now" para o ano corrente, provavelmente para tirar
          -- o hardcoded dos 3 meses tem q ler da tabela do execucao_disponivel_meses e pensar em alguma logica para quando for
          -- janeiro (ou talvez menor que o primeiro mes que está na array) vale o ano que passou como concluido
          -- depois vale qualquer registro do ano corrente
          WHEN ano_referencia = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') THEN
            CASE
              WHEN (
                SELECT count(DISTINCT mo.orgao_id)
                FROM pdm_orcamento_realizado_config porc
                JOIN meta_orgao mo ON mo.meta_id = porc.meta_id AND mo.responsavel = true AND mo.orgao_id = porc.orgao_id
                WHERE porc.ano_referencia = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo') - 1
                  AND porc.atualizado_em >= (CURRENT_DATE - INTERVAL '3 months')::date
                  AND porc.ultima_revisao = true
                  AND porc.execucao_concluida = true
                  AND porc.meta_id = pMetaId
                  AND porc.atualizado_em < '2024-03-01'::date + '1 month'::interval
                  AND CURRENT_DATE < '2024-03-01'::date + '1 month'::interval
              ) = (SELECT count(1) FROM meta_orgao mo WHERE mo.meta_id = pMetaId and mo.responsavel = TRUE )
                THEN 1
              WHEN (
                SELECT count(DISTINCT mo.orgao_id)
                FROM pdm_orcamento_realizado_config porc
                JOIN meta_orgao mo ON mo.meta_id = porc.meta_id AND mo.responsavel = true AND mo.orgao_id = porc.orgao_id
                WHERE porc.ano_referencia = EXTRACT(YEAR FROM CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
                  AND porc.ultima_revisao = true
                  AND porc.execucao_concluida = true
                  AND porc.meta_id = pMetaId
                  AND porc.atualizado_em >= '2024-03-01'::date + '1 month'::interval
                  AND CURRENT_DATE >= '2024-03-01'::date + '1 month'::interval
              ) = (SELECT count(1) FROM meta_orgao mo WHERE mo.meta_id = pMetaId and mo.responsavel = TRUE )
                THEN 1
              ELSE 0
            END
          ELSE 0
        END AS executado
      FROM pdm_orcamento_realizado_config
      WHERE meta_id = pMetaId
      AND ultima_revisao = true
      AND execucao_concluida = true
      GROUP BY 1, 2
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

    v_orcamento_pendentes := ARRAY(
        SELECT unnest(v_orc_total)
            EXCEPT
        SELECT unnest(v_orc_preenchido)
    );
    v_orcamento_pendente = NOT ARRAY(
        SELECT unnest(v_orc_total)
            EXCEPT
        SELECT unnest(v_orc_preenchido)
    ) = ARRAY[]::int[];

    -- deixando separado, pois no detalhe (monitoramento) não retronar os v_orcamento_pendente
    --IF (v_orcamento_pendente) THEN
        --v_pendente_cp := true;
    --END IF;


    IF (v_cronograma_atraso_ini != ARRAY[]::int[] OR v_cronograma_atraso_fim != ARRAY[]::int[] ) THEN
        v_pendente_cp := true;
        v_pendente_cp_cronograma := true;
    END IF;

    if (v_pendente_cp_variavel AND v_variaveis_total = ARRAY[]::int[] ) then
        v_pendente_cp := v_pendente_cp_cronograma;
        v_pendente_cp_variavel := FALSE;
    end if;

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
        orcamento_pendentes,

        analise_qualitativa_enviada,
        risco_enviado,
        fechamento_enviado,

        pendente_cp,
        pendente_cp_variavel,
        pendente_cp_cronograma,
        orcamento_pendente,
        fase,

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
        v_orcamento_pendentes,

        v_analise_qualitativa_enviada,
        v_risco_enviado,
        v_fechamento_enviado,

        v_pendente_cp,
        v_pendente_cp_variavel,
        v_pendente_cp_cronograma,
        --
        v_orcamento_pendente,
        v_fase,

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
        JOIN pdm on pdm.id = mvp.pdm_id AND pdm.tipo = 'PDM'
        JOIN variavel v on v.id = sv.variavel_id
        WHERE sv.serie = 'PrevistoAcumulado' AND mvp.meta_id = pMetaId
        and sv.data_valor < date_trunc('month', (now() - ( v.atraso_meses || ' month')::interval) at time zone 'America/Sao_Paulo')
        AND (pdm.considerar_atraso_apos IS NULL OR sv.data_valor >= pdm.considerar_atraso_apos)
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
            case when
                extract(year from data_valor) = extract(year from CURRENT_TIMESTAMP AT TIME ZONE 'America/Sao_Paulo')
                then data_valor
                else data_valor + '11 month'::interval
            end as data_valor,
            1 as qtde_orcamento
        from (
            -- todo colocar o mes de dezembro nos anos que não é o corrente
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

DELETE FROM meta_status_consolidado_cf;
DELETE FROM meta_status_atraso_consolidado_mes;
DELETE FROM meta_status_atraso_variavel;
SELECT atualiza_meta_status_consolidado(
    id,
        (select id from ciclo_fisico where ativo AND pdm_id = (select id from pdm where ativo and tipo='PDM'))
    )
    FROM meta
    WHERE pdm_id = (select id from pdm where ativo and tipo='PDM')
AND removido_em IS NULL;
