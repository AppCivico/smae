
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
