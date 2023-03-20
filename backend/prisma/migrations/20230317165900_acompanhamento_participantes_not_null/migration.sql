/*
  Warnings:

  - Made the column `participantes` on table `projeto_acompanhamento` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "projeto_acompanhamento" ALTER COLUMN "participantes" SET NOT NULL;



CREATE OR REPLACE FUNCTION f_trg_estapa_esticar_datas_do_pai() RETURNS trigger AS $emp_stamp$
DECLARE
    v_termino_previsto date;
    v_termino_real date;
BEGIN

    -- apenas em modificações de etapas (e nao fases e subfases)
    -- buscar quais cronogramas a etapa está associada, e então recalcular um por um
    IF NEW.etapa_pai_id IS NULL THEN
        PERFORM  atualiza_inicio_fim_cronograma(sub.cronograma_id)
            FROM (
                select ce.cronograma_id
                FROM cronograma_etapa ce
                WHERE ce.etapa_id = NEW.id
                GROUP BY 1
            ) sub;
    END IF;

    -- fase e subfases
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


        -- sempre recalcula o termino_previsto de acordo com a situacao atual
        SELECT MAX(ef.termino_previsto) INTO v_termino_previsto
        FROM etapa ef
        WHERE ef.etapa_pai_id = NEW.etapa_pai_id
          AND ef.removido_em IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM etapa ef2
            WHERE ef2.etapa_pai_id = NEW.etapa_pai_id
              AND ef2.termino_previsto IS NULL
              AND ef2.removido_em IS NULL
          );

        SELECT MAX(ef.termino_real) INTO v_termino_real
        FROM etapa ef
        WHERE ef.etapa_pai_id = NEW.etapa_pai_id
          AND ef.removido_em IS NULL
          AND NOT EXISTS (
            SELECT 1
            FROM etapa ef2
            WHERE ef2.etapa_pai_id = NEW.etapa_pai_id
              AND ef2.termino_real IS NULL
              AND ef2.removido_em IS NULL
          );

        UPDATE etapa e
        SET termino_previsto = v_termino_previsto,
            termino_real = v_termino_real
        WHERE e.id = NEW.etapa_pai_id
        AND (
            (termino_previsto IS DISTINCT FROM v_termino_previsto) OR
            (termino_real IS DISTINCT FROM v_termino_real)
        );

    END IF;

    RETURN NEW;
END;
$emp_stamp$ LANGUAGE plpgsql;
