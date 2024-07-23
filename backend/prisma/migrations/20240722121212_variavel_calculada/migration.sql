-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'refresh_variavel';

-- AlterTable
ALTER TABLE "formula_composta" ADD COLUMN     "criar_variavel" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "variavel_calc_erro" TEXT,
ADD COLUMN     "variavel_calc_id" INTEGER;

-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "recalculando" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "recalculo_erro" TEXT,
ADD COLUMN     "recalculo_tempo" DECIMAL(65,30);

-- AddForeignKey
ALTER TABLE "formula_composta" ADD CONSTRAINT "formula_composta_variavel_calc_id_fkey" FOREIGN KEY ("variavel_calc_id") REFERENCES "variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION f_trg_formula_composta_variavel_calculada()
    RETURNS TRIGGER
    AS $emp_stamp$
DECLARE
    _debug varchar;
BEGIN
    IF NEW.variavel_calc_id IS NOT NULL THEN
        SELECT
            refresh_variavel(NEW.variavel_calc_id, '{}'::jsonb) INTO _debug;
    END IF;
    RETURN NEW;
END;
$emp_stamp$
LANGUAGE plpgsql;

CREATE TRIGGER trg_formula_composta_variavel_calculada
    AFTER INSERT OR UPDATE ON formula_composta
    FOR EACH ROW
    EXECUTE FUNCTION f_trg_formula_composta_variavel_calculada();


CREATE OR REPLACE FUNCTION ultimo_periodo_valido(pPeriodicidade "Periodicidade", pAtrasoMeses INT)
RETURNS DATE
AS $$
DECLARE
    vUltimoPeriodo DATE;
BEGIN
    vUltimoPeriodo := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - (pAtrasoMeses || ' months')::interval;
    vUltimoPeriodo := vUltimoPeriodo - ((EXTRACT(MONTH FROM vUltimoPeriodo)::integer - 1) % (EXTRACT(MONTH FROM periodicidade_intervalo(pPeriodicidade))::integer)) * '1 month'::interval;

    RETURN vUltimoPeriodo;
END;
$$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION refresh_variavel(pVariavelId int, pInfo jsonb)
    RETURNS varchar
    AS $$
DECLARE
    current_txid bigint;
BEGIN
    UPDATE
        variavel
    SET
        recalculando = TRUE,
        recalculo_erro = NULL,
        recalculo_tempo = NULL
    WHERE
        id = pVariavelId;
    current_txid := txid_current();
    IF (pInfo IS NULL) THEN
        pInfo := '{}'::jsonb;
    END IF;
    INSERT INTO task_queue("type", params)
        VALUES ('refresh_variavel', json_build_object('variavel_id', pVariavelId, 'current_txid', current_txid)::jsonb || pInfo);
    --
    RETURN '';
END
$$
LANGUAGE plpgsql;

