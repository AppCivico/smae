-- AlterTable
ALTER TABLE "status_sei" ADD COLUMN     "usuarios_lidos" INTEGER[];
CREATE OR REPLACE FUNCTION ultimo_periodo_valido(pPeriodicidade "Periodicidade", pAtrasoMeses INT)
RETURNS DATE
AS $$
DECLARE
    vUltimoPeriodo DATE;
    vIntervalo INTERVAL;
BEGIN
    vUltimoPeriodo := date_trunc('month', now() AT TIME ZONE 'America/Sao_Paulo') - (pAtrasoMeses || ' months')::interval;
    vIntervalo := periodicidade_intervalo(pPeriodicidade);

    IF EXTRACT(YEAR FROM vIntervalo) > 0 THEN
        vUltimoPeriodo := date_trunc('year', vUltimoPeriodo);
        vUltimoPeriodo := vUltimoPeriodo - ((EXTRACT(YEAR FROM vUltimoPeriodo)::integer % EXTRACT(YEAR FROM vIntervalo)::integer) * '1 year'::interval);
    ELSE
        vUltimoPeriodo := vUltimoPeriodo - ((EXTRACT(MONTH FROM vUltimoPeriodo)::integer - 1) % (EXTRACT(MONTH FROM vIntervalo)::integer)) * '1 month'::interval;
    END IF;

    RETURN vUltimoPeriodo;
END;
$$ LANGUAGE plpgsql;
