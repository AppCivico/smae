/*
  Warnings:

  - The values [Analtico] on the enum `TipoRelatorio` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "TipoRelatorio_new" AS ENUM ('Consolidado', 'Analitico');
ALTER TABLE "relatorio" ALTER COLUMN "tipo" TYPE "TipoRelatorio_new" USING ("tipo"::text::"TipoRelatorio_new");
ALTER TYPE "TipoRelatorio" RENAME TO "TipoRelatorio_old";
ALTER TYPE "TipoRelatorio_new" RENAME TO "TipoRelatorio";
DROP TYPE "TipoRelatorio_old";
COMMIT;
