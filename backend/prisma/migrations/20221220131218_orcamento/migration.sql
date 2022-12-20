/*
  Warnings:

  - The values [OrcamentoExecutado] on the enum `FonteRelatorio` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FonteRelatorio_new" AS ENUM ('Orcamento', 'IndicadoresSemestral', 'IndicadoresAnual', 'MonitoramentoMensal');
ALTER TABLE "relatorio" ALTER COLUMN "fonte" TYPE "FonteRelatorio_new" USING ("fonte"::text::"FonteRelatorio_new");
ALTER TYPE "FonteRelatorio" RENAME TO "FonteRelatorio_old";
ALTER TYPE "FonteRelatorio_new" RENAME TO "FonteRelatorio";
DROP TYPE "FonteRelatorio_old";
COMMIT;
