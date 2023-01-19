/*
  Warnings:

  - The values [Detalhamento] on the enum `ProjetoFase` will be removed. If these variants are still used in the database, this will fail.
  - The values [EmRegistro,EmDetalhamento,EmExecucao,EmFechamento,EmSuspensao] on the enum `ProjetoStatus` will be removed. If these variants are still used in the database, this will fail.
  - The values [Padrao] on the enum `StatusRisco` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `duracao_planejado_calc` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `inicio_planejado_calc` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `termino_planejado_calc` on the `Tarefa` table. All the data in the column will be lost.
  - You are about to drop the column `previsao_duracao_calc` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `previsao_inicio_calc` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `previsao_termino_calc` on the `projeto` table. All the data in the column will be lost.
  - You are about to drop the column `processo_sei` on the `projeto_licao_aprendida` table. All the data in the column will be lost.
  - You are about to drop the column `registro_sei_errmsg` on the `projeto_licao_aprendida` table. All the data in the column will be lost.
  - You are about to drop the column `registro_sei_info` on the `projeto_licao_aprendida` table. All the data in the column will be lost.
  - Added the required column `principais_etapas` to the `projeto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `resumo` to the `projeto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ProjetoFase_new" AS ENUM ('Registro', 'Planejamento', 'Acompanhamento', 'Encerramento');
ALTER TABLE "projeto" ALTER COLUMN "fase" TYPE "ProjetoFase_new" USING ("fase"::text::"ProjetoFase_new");
ALTER TYPE "ProjetoFase" RENAME TO "ProjetoFase_old";
ALTER TYPE "ProjetoFase_new" RENAME TO "ProjetoFase";
DROP TYPE "ProjetoFase_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProjetoStatus_new" AS ENUM ('Registrado', 'Priorizado', 'EmPlanejamento', 'Validado', 'EmAcompanhamento', 'Fechado', 'Suspenso');
ALTER TABLE "projeto" ALTER COLUMN "status" TYPE "ProjetoStatus_new" USING ("status"::text::"ProjetoStatus_new");
ALTER TYPE "ProjetoStatus" RENAME TO "ProjetoStatus_old";
ALTER TYPE "ProjetoStatus_new" RENAME TO "ProjetoStatus";
DROP TYPE "ProjetoStatus_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "StatusRisco_new" AS ENUM ('SemInformacao', 'Aumentando', 'Estatico', 'Diminuindo', 'SobControle');
ALTER TABLE "plano_acao_monitoramento" ALTER COLUMN "status_risco" TYPE "StatusRisco_new" USING ("status_risco"::text::"StatusRisco_new");
ALTER TYPE "StatusRisco" RENAME TO "StatusRisco_old";
ALTER TYPE "StatusRisco_new" RENAME TO "StatusRisco";
DROP TYPE "StatusRisco_old";
COMMIT;

-- AlterTable
ALTER TABLE "Tarefa" DROP COLUMN "duracao_planejado_calc",
DROP COLUMN "inicio_planejado_calc",
DROP COLUMN "termino_planejado_calc";

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "previsao_duracao_calc",
DROP COLUMN "previsao_inicio_calc",
DROP COLUMN "previsao_termino_calc",
ADD COLUMN     "principais_etapas" TEXT NOT NULL,
ADD COLUMN     "resumo" TEXT NOT NULL,
ALTER COLUMN "codigo" DROP NOT NULL;

-- AlterTable
ALTER TABLE "projeto_licao_aprendida" DROP COLUMN "processo_sei",
DROP COLUMN "registro_sei_errmsg",
DROP COLUMN "registro_sei_info";
