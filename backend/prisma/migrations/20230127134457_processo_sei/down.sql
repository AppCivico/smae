-- AlterEnum
BEGIN;
CREATE TYPE "FonteRelatorio_new" AS ENUM ('Orcamento', 'Indicadores', 'MonitoramentoMensal');
ALTER TABLE "relatorio" ALTER COLUMN "fonte" TYPE "FonteRelatorio_new" USING ("fonte"::text::"FonteRelatorio_new");
ALTER TYPE "FonteRelatorio" RENAME TO "FonteRelatorio_old";
ALTER TYPE "FonteRelatorio_new" RENAME TO "FonteRelatorio";
DROP TYPE "FonteRelatorio_old";
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "ProjetoStatus_new" AS ENUM ('Registrado', 'Priorizado', 'EmPlanejamento', 'Validado', 'EmAcompanhamento', 'Fechado', 'Suspenso');
ALTER TABLE "projeto" ALTER COLUMN "status" TYPE "ProjetoStatus_new" USING ("status"::text::"ProjetoStatus_new");
ALTER TYPE "ProjetoStatus" RENAME TO "ProjetoStatus_old";
ALTER TYPE "ProjetoStatus_new" RENAME TO "ProjetoStatus";
DROP TYPE "ProjetoStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "meta_orcamento" DROP CONSTRAINT "meta_orcamento_versao_anterior_id_fkey";

-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "portfolio" DROP CONSTRAINT "portfolio_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "portifolio_orgao" DROP CONSTRAINT "portifolio_orgao_portifolio_id_fkey";

-- DropForeignKey
ALTER TABLE "portifolio_orgao" DROP CONSTRAINT "portifolio_orgao_orgao_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjetoRegistroSei" DROP CONSTRAINT "ProjetoRegistroSei_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_portfolio_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_orgao_responsavel_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_responsavel_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_registrado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_selecionado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_em_planejamento_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_arquivado_por_fkey";

-- DropIndex
DROP INDEX "meta_orcamento_versao_anterior_id_key";

-- AlterTable
ALTER TABLE "meta_orcamento" DROP COLUMN "versao_anterior_id";

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "em_planejamento_em",
DROP COLUMN "em_planejamento_por",
DROP COLUMN "orgao_gestor_id",
DROP COLUMN "orgao_responsavel_id",
DROP COLUMN "orgaos_participantes",
DROP COLUMN "portfolio_id",
DROP COLUMN "registrado_em",
DROP COLUMN "registrado_por",
DROP COLUMN "removido_em",
DROP COLUMN "removido_por",
DROP COLUMN "responsaveis_no_orgao_gestor",
DROP COLUMN "responsavel_id",
DROP COLUMN "selecionado_em",
DROP COLUMN "selecionado_por",
ADD COLUMN     "aprovacao_processo_sei" TEXT,
ADD COLUMN     "aprovacao_registro_sei_errmsg" TEXT,
ADD COLUMN     "aprovacao_registro_sei_info" JSONB,
ADD COLUMN     "aprovado_em" TIMESTAMP(3),
ADD COLUMN     "aprovado_por" INTEGER,
ADD COLUMN     "diretorio_id" INTEGER NOT NULL,
ADD COLUMN     "encerramento_processo_sei" TEXT,
ADD COLUMN     "encerramento_registro_sei_errmsg" TEXT,
ADD COLUMN     "encerramento_registro_sei_info" JSONB,
ADD COLUMN     "priorizado_em" TIMESTAMP(3),
ADD COLUMN     "priorizado_por" INTEGER,
ADD COLUMN     "responsavel" TEXT,
DROP COLUMN "versao",
ADD COLUMN     "versao" DATE;

-- AlterTable
ALTER TABLE "projeto_fonte_recurso" DROP COLUMN "fonte_recurso_ano",
DROP COLUMN "fonte_recurso_cod_sof",
ADD COLUMN     "fonte_recurso_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "portfolio";

-- DropTable
DROP TABLE "portifolio_orgao";

-- DropTable
DROP TABLE "ProjetoRegistroSei";

-- DropEnum
DROP TYPE "CategoriaProcessoSei";

-- CreateTable
CREATE TABLE "Diretorio" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "padrao" BOOLEAN NOT NULL,
    "ativo" BOOLEAN NOT NULL,

    CONSTRAINT "Diretorio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projeto_orgao" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "responsavel" BOOLEAN NOT NULL,

    CONSTRAINT "projeto_orgao_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Diretorio_titulo_key" ON "Diretorio"("titulo" ASC);

-- AddForeignKey
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_diretorio_id_fkey" FOREIGN KEY ("diretorio_id") REFERENCES "Diretorio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_fonte_recurso" ADD CONSTRAINT "projeto_fonte_recurso_fonte_recurso_id_fkey" FOREIGN KEY ("fonte_recurso_id") REFERENCES "fonte_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_orgao" ADD CONSTRAINT "projeto_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_orgao" ADD CONSTRAINT "projeto_orgao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

