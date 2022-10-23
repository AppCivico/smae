CREATE OR REPLACE FUNCTION f_trg_estapa_esticar_datas_do_pai() RETURNS trigger AS $emp_stamp$
    BEGIN
    
        -- etapas
        IF NEW.etapa_pai_id IS NOT NULL THEN
        
            if (NEW.inicio_previsto IS NOT NULL) then
                UPDATE etapa e
                SET inicio_previsto = NEW.inicio_previsto
                WHERE e.id = NEW.etapa_pai_id
                AND (e.inicio_previsto IS NULL OR e.inicio_previsto > NEW.inicio_previsto); -- apenas se tiver maior
            END IF;
            
            IF  NEW.inicio_real IS NOT NULL THEN
                UPDATE etapa e
                SET inicio_real = NEW.inicio_real
                WHERE e.id = NEW.etapa_pai_id
                AND (e.inicio_real IS  NULL OR e.inicio_real > NEW.inicio_real) ;
            END IF;

            IF  NEW.termino_previsto IS NOT NULL THEN
                UPDATE etapa e
                SET termino_previsto = (
                     select max(termino_previsto) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id and removido_em is null
                )
                WHERE e.id = NEW.etapa_pai_id
                AND (
                    select count(1) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id
                    where ef.termino_real IS NULL  and removido_em is null
                ) = 0
                AND (e.termino_previsto IS NULL OR e.termino_previsto != (
                     select max(termino_previsto) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id  and removido_em is null
                ));
            END IF;
            
            
            IF  NEW.termino_real IS NOT NULL THEN
                UPDATE etapa e
                SET termino_real = (
                     select max(termino_previsto) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id  and removido_em is null
                )
                WHERE e.id = NEW.etapa_pai_id
                AND (
                    select count(1) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id
                    where ef.termino_real IS NULL  and removido_em is null
                ) = 0
                AND (termino_real is null or termino_real != (
                     select max(termino_previsto) from etapa ef where ef.etapa_pai_id = NEW.etapa_pai_id  and removido_em is null
                )); 
            END IF;
            
        END IF;

        -- cronogramas
        IF NEW.cronograma_id IS NOT NULL THEN
            UPDATE cronograma c
            SET inicio_previsto = (
                select min(inicio_previsto) from etapa ef where ef.cronograma_id = NEW.cronograma_id  and removido_em is null
            )
            WHERE c.id = NEW.cronograma_id
            AND (c.inicio_previsto IS NULL OR inicio_previsto != (
                select min(inicio_previsto) from etapa ef where ef.cronograma_id = NEW.cronograma_id  and removido_em is null
            ));

            UPDATE cronograma c
            SET inicio_real = (
                select min(inicio_real) from etapa ef where ef.cronograma_id = NEW.cronograma_id  and removido_em is null
            )
            WHERE c.id = NEW.cronograma_id
            AND (c.inicio_real IS NULL OR inicio_real != (
                select min(inicio_real) from etapa ef where ef.cronograma_id = NEW.cronograma_id  and removido_em is null
            ));

            UPDATE cronograma e
            SET termino_previsto = (select max(termino_previsto) from etapa where ef.cronograma_id = NEW.cronograma_id and removido_em is null)
            WHERE e.id = NEW.cronograma_id
            AND (e.termino_previsto is null or termino_previsto != (select max(termino_previsto) from etapa where ef.cronograma_id = NEW.cronograma_id  and removido_em is null))
            AND (select count(1) from etapa where ef.cronograma_id = NEW.cronograma_id and termino_previsto is null and removido_em is null) = 0;
             
        END IF;

        RETURN NEW;
    END;
$emp_stamp$ LANGUAGE plpgsql;


CREATE TRIGGER trg_estapa_esticar_datas_do_pai AFTER INSERT ON etapa
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();

CREATE TRIGGER trg_estapa_esticar_datas_do_pai_update AFTER  UPDATE ON etapa
    FOR EACH ROW
    WHEN (
        (OLD.inicio_previsto IS DISTINCT FROM NEW.inicio_previsto)
        OR
        (OLD.termino_previsto IS DISTINCT FROM NEW.termino_previsto)
        OR
        (OLD.inicio_real IS DISTINCT FROM NEW.inicio_real)
        OR
        (OLD.termino_real IS DISTINCT FROM NEW.termino_real)
    )
    EXECUTE FUNCTION f_trg_estapa_esticar_datas_do_pai();
