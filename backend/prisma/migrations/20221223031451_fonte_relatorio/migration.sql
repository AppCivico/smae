/*
  Warnings:

  - The values [IndicadoresSemestral,IndicadoresAnual] on the enum `FonteRelatorio` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE OR REPLACE FUNCTION valor_indicador_em(pIndicador_id int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS numeric(95, 60)
    AS $$
DECLARE
    _valor numeric(95, 60);
BEGIN
    SELECT
        si.valor_nominal into _valor
    FROM
        serie_indicador si
    where si.indicador_id = pIndicador_id
    and si.serie = pSerie
    and si.data_valor <= pPeriodo
    and si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
    and ha_conferencia_pendente = false
    order by si.data_valor desc
    LIMIT 1;
    return _valor;
END
$$
LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION valor_variavel_em(pVariavelId int, pSerie "Serie", pPeriodo date, janela int)
    RETURNS numeric(95, 60)
    AS $$
DECLARE
    _valor numeric(95, 60);
BEGIN
    SELECT
        si.valor_nominal into _valor
    FROM
        serie_variavel si
    where si.variavel_id = pVariavelId
    and si.serie = pSerie
    and si.data_valor <= pPeriodo
    and si.data_valor > (pPeriodo - (janela || ' months')::interval)::date
    and conferida = true
    order by si.data_valor desc
    LIMIT 1;
    return _valor;
END
$$
LANGUAGE plpgsql;

CREATE TYPE "FonteRelatorio_new" AS ENUM ('Orcamento', 'Indicadores', 'MonitoramentoMensal');
ALTER TABLE "relatorio" ALTER COLUMN "fonte" TYPE "FonteRelatorio_new" USING ("fonte"::text::"FonteRelatorio_new");
ALTER TYPE "FonteRelatorio" RENAME TO "FonteRelatorio_old";
ALTER TYPE "FonteRelatorio_new" RENAME TO "FonteRelatorio";
DROP TYPE "FonteRelatorio_old";
COMMIT;
