
drop trigger if exists trg_cronograma_etapa_recalc_pessoa on cronograma_etapa;

CREATE TRIGGER trg_etapa_responsavel_recalc_pessoa AFTER INSERT OR DELETE OR UPDATE ON etapa_responsavel
    FOR EACH STATEMENT
    EXECUTE FUNCTION f_recalc_acesso_pessoas();

delete from cronograma_etapa ce where exists (select 1 from etapa where id = ce.etapa_id and removido_em is not null);

UPDATE "cronograma_etapa" ce SET ordem = sub.ordem_calculada
FROM (
    SELECT *
    FROM (SELECT *, row_number() OVER(PARTITION BY cronograma_id, nivel order by cronograma_id asc, etapa_id asc) AS ordem_calculada FROM cronograma_etapa) x
) sub
WHERE ce.id = sub.id;
