
CREATE OR REPLACE FUNCTION recalculate_planos_de_acao_sem_dt_term()
RETURNS TRIGGER AS $$
BEGIN
    -- na teoria não é pra mudar de plano de ação, mas vai que muda...
    IF (OLD.projeto_risco_id IS NOT NULL AND OLD.projeto_risco_id IS DISTINCT FROM NEW.projeto_risco_id) THEN
        UPDATE projeto_risco
        SET planos_de_acao_sem_dt_term =
            ARRAY(
                    SELECT id
                    FROM plano_acao
                    WHERE projeto_risco_id = OLD.projeto_risco_id
                    AND data_termino IS NULL
                    AND removido_em IS NULL
                )
        WHERE id = OLD.projeto_risco_id;
    END IF;

    UPDATE projeto_risco
    SET planos_de_acao_sem_dt_term =
        ARRAY(
                SELECT id
                FROM plano_acao
                WHERE projeto_risco_id = NEW.projeto_risco_id
                AND data_termino IS NULL
                AND removido_em IS NULL
            )
    WHERE id = NEW.projeto_risco_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER trigger_recalculate_planos_de_acao_sem_dt_term
--AFTER INSERT OR UPDATE ON "plano_acao"
--FOR EACH ROW
--EXECUTE FUNCTION recalculate_planos_de_acao_sem_dt_term();


CREATE OR REPLACE FUNCTION recalculate_projeto_riscos()
RETURNS TRIGGER AS $$
BEGIN

    UPDATE projeto
    SET
        qtde_riscos =
        (
            SELECT count(1)
            FROM projeto_risco
            WHERE projeto_id = NEW.projeto_id
            AND removido_em IS NULL
            and status_risco != 'Fechado'
        ),
        risco_maximo =
        (
            select case
                    when mt.max_grau is null then null
                    when mt.max_grau = 5 then 'Muito alto'
                    when mt.max_grau = 4 then 'Alto'
                    when mt.max_grau = 3 then 'Médio'
                    when mt.max_grau = 2 then 'Baixo'
                    when mt.max_grau = 1 then 'Muito baixo'
                 END
             from (
                SELECT max(grau) as max_grau
                FROM projeto_risco
                WHERE projeto_id = NEW.projeto_id
                AND removido_em IS NULL
                and status_risco != 'Fechado'
            ) mt
        )
    WHERE id = NEW.projeto_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--CREATE TRIGGER trigger_recalculate_planos_de_acao_sem_dt_term
--AFTER INSERT OR UPDATE ON "projeto_risco"
--FOR EACH ROW
--EXECUTE FUNCTION recalculate_projeto_riscos();
