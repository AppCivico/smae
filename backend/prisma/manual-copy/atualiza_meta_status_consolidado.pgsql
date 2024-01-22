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
            ELSE true END AS enviada

        from mv_variavel_pdm iv
        join variavel v on v.id = iv.variavel_id
        left join status_variavel_ciclo_fisico svcf ON svcf.variavel_id = v.id
            AND svcf.ciclo_fisico_id = pCicloFisicoIdAtual
        where iv.meta_id = pMetaId and iv.pdm_id = v_pdm_id
    ),
    cte_variaveis_preenchidas as (
        select
            v.variavel_id,
            sv.conferida
        from cte_variaveis v
        join serie_variavel sv on sv.variavel_id = v.variavel_id and sv.serie = 'Realizado'
            and sv.data_valor = v_data_ciclo + v.atraso
    )
    select
        coalesce(array_agg(v.variavel_id), '{}'::int[]) as v_total,
        coalesce((select array_agg(variavel_id) from cte_variaveis_preenchidas), '{}'::int[]) as v_variaveis_preenchidas,
        coalesce(array_agg(v.variavel_id) filter (where enviada), '{}'::int[]) as v_enviada,
        coalesce( (select array_agg(variavel_id) from cte_variaveis_preenchidas where conferida), '{}'::int[]) as v_variaveis_conferidas,
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


    v_pendente_cp := false;

    IF (v_fase != 'Coleta' AND (
               (NOT v_fechamento_enviado          AND v_fase = 'Fechamento'                       )
            OR (NOT v_risco_enviado               AND v_fase IN ('Risco', 'Fechamento')           )
            OR (NOT v_analise_qualitativa_enviada AND v_fase IN ('Analise', 'Risco', 'Fechamento'))
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
        variaveis_aguardando_cp,
        variaveis_aguardando_complementacao,
        cronograma_total,
        cronograma_preenchido,
        orcamento_total,
        orcamento_preenchido,

        analise_qualitativa_enviada,
        risco_enviado,
        fechamento_enviado,

        pendente_cp,

        atualizado_em

    ) values (
        pMetaId,
        pCicloFisicoIdAtual,
        v_variaveis_total,
        v_variaveis_preenchidas,
        v_variaveis_enviadas,
        v_variaveis_conferidas,
        '{}'::int[], --v_variaveis_aguardando_cp,
        v_variaveis_aguardando_complementacao,
        '{}'::int[],
        '{}'::int[],
        '{}'::int[],
        '{}'::int[],

        v_analise_qualitativa_enviada,
        v_risco_enviado,
        v_fechamento_enviado,

        v_pendente_cp,

        now()
    );

    --
    RETURN v_debug;
END
$$
LANGUAGE plpgsql;


select atualiza_meta_status_consolidado(154, 630);
select * from meta_status_consolidado_cf;
