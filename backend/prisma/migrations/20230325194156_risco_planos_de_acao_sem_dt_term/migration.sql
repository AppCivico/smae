-- AlterTable
ALTER TABLE "projeto_risco" ADD COLUMN     "planos_de_acao_sem_dt_term" INTEGER[];

update "projeto_risco" set "planos_de_acao_sem_dt_term"='{}'::int[];

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

CREATE TRIGGER trigger_recalculate_planos_de_acao_sem_dt_term
AFTER INSERT OR UPDATE ON "plano_acao"
FOR EACH ROW
EXECUTE FUNCTION recalculate_planos_de_acao_sem_dt_term();

update plano_acao set id = id;