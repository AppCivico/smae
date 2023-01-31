-- AlterEnum
BEGIN;
CREATE TYPE "FonteRelatorio_new" AS ENUM ('Orcamento', 'Indicadores', 'MonitoramentoMensal', 'PrevisaoCusto');
ALTER TABLE "relatorio" ALTER COLUMN "fonte" TYPE "FonteRelatorio_new" USING ("fonte"::text::"FonteRelatorio_new");
ALTER TYPE "FonteRelatorio" RENAME TO "FonteRelatorio_old";
ALTER TYPE "FonteRelatorio_new" RENAME TO "FonteRelatorio";
DROP TYPE "FonteRelatorio_old";
COMMIT;

