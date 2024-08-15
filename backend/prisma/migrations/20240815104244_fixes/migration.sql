/*
  Warnings:

  - You are about to drop the column `atualizado_em` on the `status_sei` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "status_sei" DROP COLUMN "atualizado_em",
ADD COLUMN     "proxima_sincronizacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "relatorio_sincronizado_em" TIMESTAMPTZ(6),
ADD COLUMN     "resumo_sincronizado_em" TIMESTAMPTZ(6),
ADD COLUMN     "sincronizacao_errmsg" TEXT;

CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_atividade()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;

        FOR v_meta_id IN (
            SELECT DISTINCT me.meta_id
            FROM iniciativa me
            JOIN mv_variavel_pdm mvp ON mvp.iniciativa_id = me.id
            WHERE me.id = NEW.iniciativa_id
        ) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- Trigger to refresh materialized view when changes occur in indicador_variavel
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_indicador_variavel()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.* IS DISTINCT FROM NEW.*)) THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;
    END IF;

    IF TG_OP = 'DELETE' THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;
        FOR v_meta_id IN (SELECT meta_id FROM mv_variavel_pdm WHERE variavel_id = OLD.variavel_id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    ELSE
        FOR v_meta_id IN (SELECT meta_id FROM mv_variavel_pdm WHERE variavel_id = NEW.variavel_id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    END IF;

    -- For INSERT or UPDATE, return NEW
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to refresh materialized view when changes occur in indicador
CREATE OR REPLACE FUNCTION refresh_mv_variavel_pdm_indicador()
RETURNS TRIGGER AS $$
DECLARE
    v_meta_id INTEGER;
BEGIN
    IF TG_OP = 'UPDATE' AND (OLD.removido_em IS DISTINCT FROM NEW.removido_em) THEN
        REFRESH MATERIALIZED VIEW mv_variavel_pdm;

        FOR v_meta_id IN (SELECT DISTINCT meta_id FROM mv_variavel_pdm WHERE indicador_id = NEW.id) LOOP
            PERFORM f_add_refresh_meta_task(v_meta_id);
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
