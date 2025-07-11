CREATE OR REPLACE FUNCTION pessoa_acesso_pdm(pPessoa_id int)
    RETURNS varchar
    AS $$
DECLARE
    vPdmId int;
    vCiclo date;
    vInt int;
    vPerfil varchar;
BEGIN

    -- prioridade pro admin
    -- se ficar sem nenhuma, mesmo tendo outras permissoes de criar ciclos, etc,
    -- vai continuar sem poder usar os endpoints do ciclo
    select
    case
        when (codigos) like '%PDM.admin_cp%' then 'admin_cp'
        when (codigos) like '%PDM.tecnico_cp%' then 'tecnico_cp'
        when (codigos) like '%PDM.ponto_focal%' then 'ponto_focal'
        else ''
    end into vPerfil
    from (
        select array_to_string(array_agg(p.codigo), ' ') as codigos
        from pessoa_perfil pp
        join perfil_acesso pa on pp.perfil_acesso_id = pa.id
        join perfil_privilegio priv on priv.perfil_acesso_id = pa.id
        join privilegio p on p.id = priv.privilegio_id
        join public.pessoa pessoa on pessoa.id = pp.pessoa_id AND pessoa.desativado = false
        where pp.pessoa_id = pPessoa_id
        AND p.codigo in (
            'PDM.ponto_focal',
            'PDM.tecnico_cp',
            'PDM.admin_cp'
        )
    ) as pessoa_perfil;
    --
    DELETE FROM pessoa_acesso_pdm
    WHERE pessoa_id = pPessoa_id;
    --
    INSERT INTO pessoa_acesso_pdm_valido (pessoa_id)
    VALUES (pPessoa_id)
    ON CONFLICT (pessoa_id) DO NOTHING;

    if (vPerfil = '') then
        return 'sem perfil';
    end if;

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
    --

    -- lock pra garantir que só ta rodando 1x por vez
    select id into vInt from pessoa where id = pPessoa_id for update;

    INSERT INTO pessoa_acesso_pdm (
        pessoa_id,
        metas_cronograma,
        metas_variaveis,
        variaveis,
        cronogramas_etapas,
        data_ciclo,
        perfil
    )
    WITH variaveis_pdm as (
        select
            vv.id as variavel_id
        from variavel vv
        where
        vv.tipo = 'PDM'
        AND exists (
            select
                1
            from indicador_variavel iv
            join (
                 -- indicadores do pdm
                select
                    im.id as indicador_id
                from meta m
                join indicador im on im.meta_id = m.id and im.removido_em is null
                where m.pdm_id = vPdmId
                and m.ativo = TRUE
                and m.removido_em is null
                UNION ALL
                select
                    ii.id as indicador_id
                from meta m
                join iniciativa i on i.meta_id = m.id and i.removido_em is null
                join indicador ii on ii.iniciativa_id = i.id and ii.removido_em is null
                where m.pdm_id = vPdmId
                and m.ativo = TRUE
                and m.removido_em is null
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

            ) i on i.indicador_id = iv.indicador_id
            WHERE iv.desativado_em is null
            and vv.id = iv.variavel_id
        )
        -- o COST da function foi alterado pra ser em teoria, maior do que o de exeuta o filtro
        -- por IDs, mas pode acontecer o PG querer filtrar todas as variaveis primeiro e depois cruzar
        -- com as subqueries
        AND variavel_participa_do_ciclo(vv.id, (vCiclo - (vv.atraso_meses || ' months')::interval)::date) = TRUE
        AND vv.removido_em IS NULL
        AND vv.mostrar_monitoramento = true
        AND vv.suspendida_em is null

    ),
    variaveis_visiveis as (
        select vpdm.variavel_id
        from variaveis_pdm vpdm
        where
            (vPerfil = 'admin_cp')
        OR (
            vPerfil  = 'ponto_focal'
            AND EXISTS (
                select 1
                from variavel_responsavel vr
                where vpdm.variavel_id = vr.variavel_id AND  vr.pessoa_id = pPessoa_id
            )
        )
        OR (
            vPerfil  = 'tecnico_cp'

            AND vpdm.variavel_id IN (

                select iv.variavel_id
                from meta_responsavel mr
                join indicador i on i.meta_id = mr.meta_id and i.removido_em is null
                join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado_em is null
                where mr.coordenador_responsavel_cp=true
                AND mr.pessoa_id=pPessoa_id

                UNION ALL

                select iv.variavel_id
                from iniciativa_responsavel ir
                join indicador i on i.iniciativa_id = ir.iniciativa_id and i.removido_em is null
                join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado_em is null
                where ir.coordenador_responsavel_cp=true
                AND ir.pessoa_id=pPessoa_id

                UNION ALL

                select iv.variavel_id
                from atividade_responsavel ar
                join indicador i on i.atividade_id = ar.atividade_id and i.removido_em is null
                join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado_em is null
                where ar.coordenador_responsavel_cp=true
                AND ar.pessoa_id=pPessoa_id


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
        AND
            (vPerfil = 'admin_cp')
        OR (
            vPerfil  = 'ponto_focal'
            AND EXISTS (
                select 1
                from etapa_responsavel er
                where ce.etapa_id = er.etapa_id AND  er.pessoa_id = pPessoa_id
            )
        )
        OR (
            vPerfil  = 'tecnico_cp'
            AND ce.etapa_id IN (

                select iv.etapa_id
                from meta_responsavel mr
                join cronograma i on i.meta_id = mr.meta_id and i.removido_em is null
                join cronograma_etapa iv on iv.cronograma_id = i.id and iv.inativo = false
                where mr.pessoa_id=pPessoa_id

                UNION ALL

                select iv.etapa_id
                from iniciativa_responsavel ir
                join cronograma i on i.iniciativa_id = ir.iniciativa_id and i.removido_em is null
                join cronograma_etapa iv on iv.cronograma_id = i.id and iv.inativo = false
                where ir.pessoa_id=pPessoa_id

                UNION ALL

                select iv.etapa_id
                from atividade_responsavel ar
                join cronograma i on i.atividade_id = ar.atividade_id and i.removido_em is null
                join cronograma_etapa iv on iv.cronograma_id = i.id and iv.inativo = false
                where ar.pessoa_id=pPessoa_id
            )
        )
    ),
    -- cruza de volta com os cronogramas, mas passando pela cronograma_etapa e buscando outros cronogramas que indiretamente os cronogramas que a etapa faz parte
    cronogramas_indiretos as (
        select ce.cronograma_id
        from public.cronograma_etapa ce
        where exists (
            select 1 from cronogramas_etapas x where ce.etapa_id = x.etapa_id
        )
        AND ce.inativo = false
    ), metas_variaveis as (
        select
            m.id as meta_id
        from meta m
        join indicador i on  i.meta_id = m.id
        join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
        where iv.variavel_id in (
            -- aqui nao adianta muda pra EXISTS pq nao vai ter index na CTE
            select variavel_id from variaveis_visiveis
        ) and m.removido_em is null and m.ativo = TRUE
            UNION ALL
        select
            m.id as meta_id
        from meta m
        join iniciativa _i on _i.meta_id = m.id
        join indicador i on  i.iniciativa_id = _i.id
        join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
        where iv.variavel_id in (
            select variavel_id from variaveis_visiveis
        ) and m.removido_em is null and m.ativo = TRUE
            UNION ALL
        select
            m.id as meta_id
        from meta m
        join iniciativa _i on _i.meta_id = m.id
        join atividade _a on _a.iniciativa_id = _i.id
        join indicador i on  i.atividade_id = _a.id
        join indicador_variavel iv on iv.indicador_id = i.id and iv.desativado=false and iv.indicador_origem_id is null
        where iv.variavel_id in (
            select variavel_id from variaveis_visiveis
        ) and m.removido_em is null and m.ativo = TRUE
    ), metas_cronograma as (
        select
            m.id as meta_id
        from meta m
        join cronograma c on  c.meta_id = m.id
        join cronogramas_indiretos x on x.cronograma_id = c.id
        where m.removido_em is null
        and m.ativo = TRUE
        and c.removido_em is null
            UNION ALL
        select
            m.id as meta_id
        from meta m
        join iniciativa i on i.meta_id = m.id
        join cronograma c on  c.iniciativa_id = i.id
        join cronogramas_indiretos x on x.cronograma_id = c.id
        where m.removido_em is null
        and m.ativo = TRUE
        and c.removido_em is null
            UNION ALL
        select
            m.id as meta_id
        from meta m
        join iniciativa i on i.meta_id = m.id
        join atividade a on a.iniciativa_id = i.id
        join cronograma c on c.atividade_id = a.id
        join cronogramas_indiretos x on x.cronograma_id = c.id
        where m.removido_em is null
        and m.ativo = TRUE
        and c.removido_em is null
    )
    select
        pPessoa_id as pessoa_id,
        (select coalesce(array_agg(distinct meta_id), '{}'::int[]) from metas_cronograma) as metas_cronograma,
        (select coalesce(array_agg(distinct meta_id), '{}'::int[]) from metas_variaveis) as metas_variaveis,
        (select coalesce(array_agg(distinct variavel_id), '{}'::int[]) from variaveis_visiveis) as variaveis,
        (select coalesce(array_agg(distinct etapa_id), '{}'::int[]) from cronogramas_etapas) as cronogramas_etapas,
        vCiclo as ciclo,
        vPerfil as perfil
    where (select count(1) from pessoa_acesso_pdm x where x.pessoa_id = pPessoa_id) = 0; -- just in case

    return 'ok';
END
$$
LANGUAGE plpgsql;

DELETE FROM pessoa_acesso_pdm_valido;
DELETE FROM pessoa_acesso_pdm;
--select pessoa_acesso_pdm(1);

-- as funcoes estao muito abertas, calculando todo mundo
-- mais pra frente vamos colocar isso apenas durante as alterações respectivas, onde for possivel.
/*
CREATE OR REPLACE FUNCTION f_recalc_acesso_pessoas() RETURNS trigger AS $emp_stamp$
BEGIN
    DELETE FROM pessoa_acesso_pdm_valido;
    DELETE FROM pessoa_acesso_pdm;
    RETURN NULL;
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

CREATE TRIGGER trg_variavel_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON variavel_responsavel
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_indicador_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON indicador
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

CREATE TRIGGER trg_etapa_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON etapa_responsavel
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

-- deu errado essa ideia, não recacula o acesso das pessoas quando é admin e cria uma nova variavel, por exemplo
CREATE OR REPLACE FUNCTION f_trigger_recalc_acesso_pessoa() RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM pessoa_acesso_pdm(NEW.pessoa_id);
    END IF;

    IF TG_OP = 'DELETE' THEN
        PERFORM pessoa_acesso_pdm(OLD.pessoa_id);
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_variavel_responsavel_recalc_pessoa ON variavel_responsavel;

DROP TRIGGER trg_variavel_responsavel_recalc_pessoa ON variavel_responsavel;
CREATE TRIGGER trg_variavel_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON variavel_responsavel
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();
DROP FUNCTION f_trigger_recalc_acesso_pessoa();

*/
