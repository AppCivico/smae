/*
  Warnings:

  - The values [ProjetoEmAprovacao,ProjetoTerminou] on the enum `ProjetoMotivoRelatorio` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjetoMotivoRelatorio_new" AS ENUM ('MudancaDeStatus', 'ProjetoSelecionado', 'ProjetoPlanejado', 'ProjetoEncerrado');
ALTER TABLE "projeto_relatorio_fila" ALTER COLUMN "motivado_relatorio" DROP DEFAULT;
ALTER TABLE "projeto_relatorio_fila" ALTER COLUMN "motivado_relatorio" TYPE "ProjetoMotivoRelatorio_new" USING ("motivado_relatorio"::text::"ProjetoMotivoRelatorio_new");
ALTER TYPE "ProjetoMotivoRelatorio" RENAME TO "ProjetoMotivoRelatorio_old";
ALTER TYPE "ProjetoMotivoRelatorio_new" RENAME TO "ProjetoMotivoRelatorio";
DROP TYPE "ProjetoMotivoRelatorio_old";
ALTER TABLE "projeto_relatorio_fila" ALTER COLUMN "motivado_relatorio" SET DEFAULT 'MudancaDeStatus';
COMMIT;
