-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_calc_regiao_id_fkey" FOREIGN KEY ("calc_regiao_id") REFERENCES "regiao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_transferencia_parlamentar_update_tsvector() RETURNS TRIGGER AS $$
BEGIN
    UPDATE transferencia
    SET vetores_busca = (
        SELECT
            to_tsvector(
                'simple',
                COALESCE(CAST(t.esfera AS TEXT), '') || ' ' ||
                COALESCE(CAST(t.interface AS TEXT), '') || ' ' ||
                COALESCE(CAST(t.ano AS TEXT), '') || ' ' ||
                COALESCE(t.gestor_contrato, ' ') || ' ' ||
                COALESCE(t.secretaria_concedente_str, ' ') || ' ' ||
                COALESCE(t.emenda, ' ') || ' ' ||
                COALESCE(t.nome_programa, ' ') || ' ' ||
                COALESCE(t.objeto, ' ') || ' ' ||
                COALESCE(tt.nome, ' ') || ' ' ||
                COALESCE(o1.sigla, ' ') || ' ' ||
                COALESCE(o1.descricao, ' ') || ' ' ||
                COALESCE(o2.sigla, ' ') || ' ' ||
                COALESCE(o2.descricao, ' ') || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(p.nome_popular AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN parlamentar p ON p.id = tp.parlamentar_id
                        WHERE tp.transferencia_id = t.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(p.sigla AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN partido p ON p.id = tp.partido_id
                        WHERE tp.transferencia_id = t.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(tp.cargo AS TEXT), ' ')
                        FROM transferencia_parlamentar tp
                        JOIN partido p ON p.id = tp.partido_id
                        WHERE tp.transferencia_id = t.id AND tp.removido_em IS NULL
                    ),
                    ' '
                ) || ' ' ||
                COALESCE(
                    ( SELECT string_agg(CAST(dr.nome AS TEXT), ' ')
                        FROM distribuicao_recurso dr
                        WHERE dr.transferencia_id = t.id AND dr.removido_em IS NULL
                    ),
                    ' '
                )
            )
        FROM transferencia t
        JOIN transferencia_tipo tt ON tt.id = t.tipo_id
        LEFT JOIN orgao o1 ON o1.id = t.orgao_concedente_id
        LEFT JOIN orgao o2 ON o2.id = t.secretaria_concedente_id
        WHERE t.id = NEW.transferencia_id
    )
    WHERE id = NEW.transferencia_id;

    RETURN NEW;
END
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER trigger_transferencia_parlamentar_update_tsvector
AFTER INSERT OR UPDATE ON transferencia_parlamentar
FOR EACH ROW
WHEN (NEW.removido_em IS NULL)
EXECUTE PROCEDURE f_transferencia_parlamentar_update_tsvector();

CREATE OR REPLACE FUNCTION busca_periodos_variavel(pVariavelId int, pIndicadorId int)
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
        LEFT JOIN indicador_variavel iv ON IV.variavel_id = v.id and iv.desativado_em is null and iv.indicador_origem_id is null
        LEFT JOIN indicador i ON Iv.indicador_id = i.id AND i.id = pIndicadorId
    WHERE
        v.id = pVariavelId and v.tipo = 'PDM';
END;
$$
LANGUAGE plpgsql STABLE;


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
        coalesce(v.inicio_medicao),
        coalesce(v.fim_medicao, CASE WHEN tipo='Global' THEN ultimo_periodo_valido( v.periodicidade::"Periodicidade" , v.atraso_meses) ELSE NULL END)
    FROM variavel v
    WHERE
        v.id = pVariavelId;
END;
$$
LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION variavel_participa_do_ciclo (pVariavelId int, dataCiclo date)
    RETURNS boolean
    AS $$
    SELECT
        coalesce((
            SELECT
                TRUE
            FROM
            busca_periodos_variavel (pVariavelId, (
                -- funcao apenas para PDM, se usar isso no PS vai dar errado
                SELECT indicador_id
                FROM indicador_variavel iv
                WHERE iv.variavel_id = pVariavelId
                AND iv.indicador_origem_id IS NULL
                AND desativado = false
                LIMIT 1
            )) AS g (periodo, inicio, fim),
            generate_series(inicio, fim, periodo) p
        WHERE
            p.p = dataCiclo), FALSE);

$$
LANGUAGE SQL COST 10000
STABLE;

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
