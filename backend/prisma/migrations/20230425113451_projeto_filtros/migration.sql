-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "percentual_atraso" INTEGER,
ADD COLUMN     "qtde_riscos" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "risco_maximo" TEXT,
ADD COLUMN     "status_cronograma" TEXT;

-- CreateIndex
CREATE INDEX "projeto_acompanhamento_projeto_id_data_registro_idx" ON "projeto_acompanhamento"("projeto_id", "data_registro");

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

CREATE TRIGGER trigger_recalculate_planos_de_acao_sem_dt_term
AFTER INSERT OR UPDATE ON "projeto_risco"
FOR EACH ROW
EXECUTE FUNCTION recalculate_projeto_riscos();

update projeto_risco set id=id;
