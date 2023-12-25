create materialized view mv_variavel_pdm as
select
m.id as meta_id,
m.pdm_id as pdm_id,
i.id as indicador_id,
    iv.variavel_id as variavel_id
from meta m
join indicador i on  i.meta_id = m.id and i.removido_em is null
join indicador_variavel iv on iv.indicador_id = i.id and iv.indicador_origem_id is null
where  m.removido_em is null and m.ativo = TRUE
    UNION ALL
select
m.id as meta_id,
m.pdm_id as pdm_id,
i.id as indicador_id,
    iv.variavel_id as variavel_id
from meta m
join iniciativa _i on _i.meta_id = m.id and _i.removido_em is null
join indicador i on  i.iniciativa_id = _i.id and i.removido_em is null
join indicador_variavel iv on iv.indicador_id = i.id and iv.indicador_origem_id is null
where m.removido_em is null and m.ativo = TRUE
    UNION ALL
select
m.id as meta_id,
m.pdm_id as pdm_id,
i.id as indicador_id,
    iv.variavel_id as variavel_id
from meta m
join iniciativa _i on _i.meta_id = m.id and _i.removido_em is null
join atividade _a on _a.iniciativa_id = _i.id and _a.removido_em is null
join indicador i on  i.atividade_id = _a.id and i.removido_em is null
join indicador_variavel iv on iv.indicador_id = i.id and iv.indicador_origem_id is null
where m.removido_em is null and m.ativo = TRUE;

CREATE INDEX mv_variavel_pdm__variavel_id
ON mv_variavel_pdm (variavel_id);

CREATE INDEX mv_variavel_pdm__meta_id
ON mv_variavel_pdm (meta_id);


-- Trigger to refresh materialized view when changes occur in indicador_variavel
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_indicador_variavel()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.* IS DISTINCT FROM NEW.*)) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_refresh_mv_variavel_pdm_indicador_variavel
AFTER INSERT OR UPDATE ON indicador_variavel
FOR EACH ROW
EXECUTE FUNCTION refresh_mv_variavel_pdm_indicador_variavel();


-- Trigger to refresh materialized view when changes occur in atividade
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_atividade()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_refresh_mv_variavel_pdm_atividade
AFTER UPDATE ON atividade
FOR EACH ROW
EXECUTE FUNCTION refresh_mv_variavel_pdm_atividade();


-- Trigger to refresh materialized view when changes occur in iniciativa
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_iniciativa()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_refresh_mv_variavel_pdm_iniciativa
AFTER UPDATE ON iniciativa
FOR EACH ROW
EXECUTE FUNCTION refresh_mv_variavel_pdm_iniciativa();


-- Trigger to refresh materialized view when changes occur in indicador
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_indicador()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_refresh_mv_variavel_pdm_indicador
AFTER UPDATE ON indicador
FOR EACH ROW
EXECUTE FUNCTION refresh_mv_variavel_pdm_indicador();


-- Trigger to refresh materialized view when removido_em or ativo columns are changed in meta
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_meta()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND (NEW.removido_em IS DISTINCT FROM OLD.removido_em OR NEW.ativo IS DISTINCT FROM OLD.ativo) THEN
    REFRESH MATERIALIZED VIEW mv_variavel_pdm;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trig_refresh_mv_variavel_pdm_meta
AFTER INSERT OR UPDATE ON meta
FOR EACH ROW
EXECUTE FUNCTION refresh_mv_variavel_pdm_meta();

CREATE OR REPLACE FUNCTION atualiza_status_meta_pessoa (pMetaId int, pPessoaId int, pCicloFisicoIdAtual int)
    RETURNS varchar
    AS $$
DECLARE

vDataCicloCorrente date;
vPerfil varchar;
vAtrasadaCount int;
vStatusColeta varchar;

vFaseColeta boolean;

vStatusCrono int;
vCronograma int[];

BEGIN
    -- recebe o pdm_id apenas pq já está calculado no GET pra não ter que buscar novamente pelo ativo aqui dentro
    delete from status_meta_ciclo_fisico where pessoa_id = pPessoaId and meta_id = pMetaId;

    SELECT
        cf.data_ciclo INTO vDataCicloCorrente
    FROM
         ciclo_fisico cf  where cf.id = pCicloFisicoIdAtual
    LIMIT 1;

    select cff.ciclo_fase='Coleta' INTO vFaseColeta
    from meta m join ciclo_fisico_fase cff on cff.id = m.ciclo_fase_id where m.id= pMetaId;

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
        with variaveis as (
            select iv.variavel_id
            from mv_variavel_pdm iv
            join pessoa_acesso_pdm pa on pa.pessoa_id = pPessoaId and iv.variavel_id = any(pa.variaveis)
            where iv.meta_id = pMetaId
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
            case when total = 0 then '-'
            when total = conferidas then 'Todas conferidas'
            when aguarda_complementacao > 0 then 'Aguardando complementação'
            when aguarda_cp = total then 'Aguardando conferencia'
            when vFaseColeta = false then 'Não atualizadas/em atraso'
            else
                case when vPerfil = 'ponto_focal' then 'Não atualizadas' else 'Aguardando coleta pelo ponto focal' end
            end
            into vStatusColeta
        from counts;


    END IF;

    select array_agg(cronograma_id)
    into vCronograma
    from (
        select
            im.id as cronograma_id
        from meta m
        join cronograma im on im.meta_id = m.id and im.removido_em is null
        where m.id = pMetaId
        and m.ativo = TRUE
        and m.removido_em is null
            UNION ALL
        select
            ii.id as cronograma_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join cronograma ii on ii.iniciativa_id = i.id and ii.removido_em is null
        where m.id = pMetaId
        and m.ativo = TRUE
        and m.removido_em is null
            UNION ALL
        select
            ia.id as cronograma_id
        from meta m
        join iniciativa i on i.meta_id = m.id and i.removido_em is null
        join atividade a on a.iniciativa_id = i.id and a.removido_em is null
        join cronograma ia on ia.atividade_id = a.id and ia.removido_em is null
        where m.id = pMetaId
        and m.ativo = TRUE
        and m.removido_em is null
    ) x;


    select
        max(
            case
            when inicio_previsto < now() and inicio_real is null then 1
            when termino_previsto < now() and termino_real is null then 2
            else 0
        end)
     as status into vStatusCrono
    from etapa e
    join (
        select b.id, (select count(1) from etapa x where x.etapa_pai_id = b.id) as filhos
        from  cronograma_etapa a
        join etapa b on b.id = a.etapa_id
        where a.cronograma_id = ANY(vCronograma) and a.inativo = false
        and etapa_pai_id is null

        union all

        select fase.id, (select count(1) from etapa x where x.etapa_pai_id = fase.id) as filhos
        from  cronograma_etapa a
        join etapa e on e.id = a.etapa_id
        join etapa fase on fase.etapa_pai_id = e.id
        where a.cronograma_id = ANY(vCronograma) and a.inativo = false
        and e.etapa_pai_id is null

        union all

        select subfase.id, (select count(1) from etapa x where x.etapa_pai_id = subfase.id) as filhos
        from  cronograma_etapa a
        join etapa e on e.id = a.etapa_id
        join etapa fase on fase.etapa_pai_id = e.id
        join etapa subfase on subfase.etapa_pai_id = fase.id
        where a.cronograma_id = ANY(vCronograma) and a.inativo = false
        and e.etapa_pai_id is null
    ) sub on sub.id = e.id and sub.filhos = 0;



    insert into status_meta_ciclo_fisico (meta_id, pessoa_id, ciclo_fisico_id, status_coleta, status_cronograma)
    select pMetaId, pPessoaId, pCicloFisicoIdAtual, vStatusColeta,
    case
        when vStatusCrono = 0 then 'Em dia'
        when vStatusCrono = 1 then 'Inicio atrasado'
        when vStatusCrono = 2 then 'Termino atrasado'
        else ''
        end;

    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

