CREATE OR REPLACE FUNCTION pessoa_acesso_pdm(pPessoa_id int)
    RETURNS varchar
    AS $$
DECLARE
    vPdmId int;
    vCiclo date;
    vLocked boolean;
    vPerfil varchar;
BEGIN
    --
    SELECT
        p.id,
        cf.data_ciclo INTO vPdmId, vCiclo
    FROM
        pdm p
    join ciclo_fisico cf on cf.pdm_id = p.id and cf.ativo
    WHERE
        p.ativo = TRUE
    LIMIT 1;
    IF vPdmId IS NULL THEN
        RETURN 'Erro: não há PDM com um ciclo fisico ativo';
    END IF;

    SELECT
        case when vCiclo is distinct from data_ciclo then false else congelado end INTO vLocked
    FROM
        pessoa_acesso_pdm
    WHERE
        pessoa_id = pPessoa_id;
    IF vLocked THEN
        RETURN 'Erro: acesso está congelado';
    END IF;
    --

    -- prioridade pro admin
    -- se ficar sem nenhuma, mesmo tendo outras permissoes de criar ciclos, etc,
    -- vai continuar sem poder usar os endpoints do ciclo
    select
    case
        when ( codigos  )  like '%PDM.admin_cp%' then 'admin_cp'
        when ( codigos )  like '%PDM.tecnico_cp%' then 'tecnico_cp'
        when (codigos )  like '%PDM.ponto_focal%' then 'ponto_focal'
        else ''
    end into vPerfil
    from (
        select array_to_string(array_agg(p.codigo), ' ') as codigos
        from pessoa_perfil pp
        join perfil_acesso pa on pp.perfil_acesso_id = pa.id
        join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
        join privilegio p on p.id = priv.privilegio_id
        join modulo m on p.modulo_id = m.id
        join public.pessoa pessoa on pessoa.id = pp.pessoa_id AND pessoa.desativado = false
        where pp.pessoa_id = pPessoa_id
        AND p.codigo in (
            'PDM.ponto_focal',
            'PDM.tecnico_cp',
            'PDM.admin_cp'
        )
    ) as pessoa_perfil;

    DELETE FROM pessoa_acesso_pdm
    WHERE pessoa_id = pPessoa_id;

    if (vPerfil = '') then
        return 'sem perfil';
    end if;

    INSERT INTO pessoa_acesso_pdm (
        pessoa_id,
        metas_cronograma,
        metas_variaveis,
        variaveis,
        cronogramas_etapas,
        data_ciclo,
        perfil,
        congelado
    )
    WITH variaveis_pdm as (
        select
            v.id as variavel_id
        from variavel v
        where v.id in (
            select
                iv.variavel_id
            from indicador_variavel iv
            join variavel v on v.id = iv.variavel_id
            join (
                -- indicadores do pdm
                select
                    im.id as indicador_id
                from meta m
                join indicador im on im.meta_id = m.id and im.removido_em is null
                where m.pdm_id = vPdmId
                and m.ativo = TRUE
                and m.removido_em is null
                AND (vPerfil != '' )
                UNION ALL
                select
                    ii.id as indicador_id
                from meta m
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                join indicador ii on ii.iniciativa_id = i.id and ii.removido_em is null
                where m.pdm_id = vPdmId
                and m.ativo = TRUE
                and m.removido_em is null
                AND (vPerfil != '' )
                UNION ALL
                select
                    ia.id as indicador_id
                from meta m
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                join atividade a on a.iniciativa_id = i.id and a.removido_em is null
                join indicador ia on ia.atividade_id = a.id and ia.removido_em is null
                where m.pdm_id = vPdmId
                and m.ativo = TRUE
                and m.removido_em is null
                AND (vPerfil != '' )


            ) i on i.indicador_id = iv.indicador_id
            WHERE iv.desativado_em is null
            group by 1
        )
        -- o COST da function foi alterado pra ser em teoria, maior do que o de exeuta o filtro
        -- por IDs, mas pode acontecer o PG querer filtrar todas as variaveis primeiro e depois cruzar
        -- com as subqueries
        AND variavel_participa_do_ciclo(v.id, (vCiclo - (v.atraso_meses || ' months')::interval)::date) = TRUE

    ),
    variaveis as (
        select vpdm.variavel_id
        from variaveis_pdm vpdm
        where
        exists (
                select 1
                from variavel_responsavel vr
                where vpdm.variavel_id = vr.variavel_id
            AND (
                CASE WHEN ( vPerfil IN ('tecnico_cp', 'ponto_focal') ) THEN
                    vr.pessoa_id = pPessoa_id
                WHEN (vPerfil IN ('admin_cp')) THEN
                    TRUE
                ELSE
                    FALSE -- zero pra quem sem perfil
                END
            )
        )
    ),
    cronogramas as (
        select
            im.id as cronograma_id
        from meta m
        join meta_responsavel mr on mr.meta_id = m.id
        AND (CASE WHEN (vPerfil IN ('tecnico_cp', 'ponto_focal')) THEN
            mr.pessoa_id = pPessoa_id
        WHEN (vPerfil IN ('admin_cp')) THEN
            TRUE
        ELSE
            FALSE -- zero pra quem é ponto_focal ou sem perfil
        END)
        join cronograma im on im.meta_id = m.id and im.removido_em is null
        where m.pdm_id = vPdmId
        and m.ativo = TRUE
        and m.removido_em is null
        UNION ALL
        select
            ii.id as cronograma_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join iniciativa_responsavel ir on ir.iniciativa_id = i.id
        AND (
            CASE WHEN (vPerfil IN ('tecnico_cp', 'ponto_focal')) THEN
                ir.pessoa_id = pPessoa_id
            WHEN (vPerfil IN ('admin_cp')) THEN
                TRUE
            ELSE
                FALSE
            END
        )
        join cronograma ii on ii.iniciativa_id = i.id and ii.removido_em is null
        where m.pdm_id = vPdmId
        and m.ativo = TRUE
        and m.removido_em is null
        UNION ALL
        select
            ia.id as cronograma_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join atividade a on a.iniciativa_id = i.id and a.removido_em is null
        join atividade_responsavel ar on ar.atividade_id = a.id
        AND
            (
            CASE WHEN (vPerfil IN ('tecnico_cp', 'ponto_focal')) THEN
                ar.pessoa_id = pPessoa_id
            WHEN (vPerfil IN ('admin_cp')) THEN
                TRUE
            ELSE
                FALSE
            END
        )
        join cronograma ia on ia.atividade_id = a.id and ia.removido_em is null
        where m.pdm_id = vPdmId
        and m.ativo = TRUE
        and m.removido_em is null
    ),
    cronogramas_etapas as (
        select
            etapa_id as etapa_id
        from public.cronograma_etapa ce
        join cronogramas x on x.cronograma_id = ce.cronograma_id
        where ce.inativo  = false
    ),
    -- cruza de volta com os cronogramas, mas passando pela cronograma_etapa e buscando outros cronogramas que indiretamente os cronogramas que a etapa faz parte
    cronogramas_indiretos as (
        select ce.cronograma_id
        from public.cronograma_etapa ce
        where ce.etapa_id in (
            select x.etapa_id from cronogramas_etapas x
        ) AND ce.inativo = false
    ), metas_variaveis as (
        select
            m.id as meta_id
        from meta m
        join indicador i on  i.meta_id = m.id
        join indicador_variavel iv on iv.indicador_id = i.id
        where iv.variavel_id in (
            select variavel_id from variaveis
        ) and m.removido_em is null and m.ativo = TRUE
        UNION ALL
        select
            m.id as meta_id
        from meta m
        join iniciativa _i on _i.meta_id = m.id
        join indicador i on  i.iniciativa_id = _i.id
        join indicador_variavel iv on iv.indicador_id = i.id
        where iv.variavel_id in (
            select variavel_id from variaveis
        ) and m.removido_em is null and m.ativo = TRUE
        UNION ALL
        select
            m.id as meta_id
        from meta m
        join iniciativa _i on _i.meta_id = m.id
        join atividade _a on _a.iniciativa_id = _i.id
        join indicador i on  i.atividade_id = _a.id
        join indicador_variavel iv on iv.indicador_id = i.id
        where iv.variavel_id in (
            select variavel_id from variaveis
        ) and m.removido_em is null and m.ativo = TRUE
    ), metas_cronograma as (
        select
            m.id as meta_id
        from meta m
        join cronograma c on  c.meta_id = m.id
        join cronogramas_indiretos x on x.cronograma_id = c.id
        where m.removido_em is null and m.ativo = TRUE
    )
    select
        pPessoa_id as pessoa_id,
        (select coalesce(array_agg(distinct meta_id), '{}'::int[]) from metas_cronograma) as metas_cronograma,
        (select coalesce(array_agg(distinct meta_id), '{}'::int[]) from metas_variaveis) as metas_variaveis,
        (select coalesce(array_agg(distinct variavel_id), '{}'::int[]) from variaveis) as variaveis,
        (select coalesce(array_agg(distinct etapa_id), '{}'::int[]) from cronogramas_etapas) as cronogramas_etapas,
        vCiclo as ciclo,
        vPerfil as perfil,
        false as congelado;

    return 'ok';
END
$$
LANGUAGE plpgsql;

-- as funcoes estao muito abertas, calculando todo mundo
-- mais pra frente vamos colocar isso apenas durante as alterações respectivas, onde for possivel.
/*
CREATE OR REPLACE FUNCTION f_recalc_acesso_pessoas() RETURNS trigger AS $emp_stamp$
BEGIN
    PERFORM pessoa_acesso_pdm(id) from pessoa where desativado=false;
    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ciclo_fisico_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON ciclo_fisico
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_meta_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON meta
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_iniciativa_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON iniciativa
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_atividade_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON atividade
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_cronograma_etapa_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON cronograma_etapa
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_variavel_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON variavel_responsavel
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();



*/