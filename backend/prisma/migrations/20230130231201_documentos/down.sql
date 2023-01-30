-- AlterEnum
BEGIN;
CREATE TYPE "FonteRelatorio_new" AS ENUM ('Orcamento', 'Indicadores', 'MonitoramentoMensal');
ALTER TABLE "relatorio" ALTER COLUMN "fonte" TYPE "FonteRelatorio_new" USING ("fonte"::text::"FonteRelatorio_new");
ALTER TYPE "FonteRelatorio" RENAME TO "FonteRelatorio_old";
ALTER TYPE "FonteRelatorio_new" RENAME TO "FonteRelatorio";
DROP TYPE "FonteRelatorio_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "meta_orcamento" DROP CONSTRAINT "meta_orcamento_versao_anterior_id_fkey";

-- DropForeignKey
ALTER TABLE "ProjetoRegistroSei" DROP CONSTRAINT "ProjetoRegistroSei_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_orgao_gestor_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_orgao_participante" DROP CONSTRAINT "projeto_orgao_participante_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_orgao_participante" DROP CONSTRAINT "projeto_orgao_participante_orgao_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_documento" DROP CONSTRAINT "projeto_documento_arquivo_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto_documento" DROP CONSTRAINT "projeto_documento_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto_documento" DROP CONSTRAINT "projeto_documento_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "projeto_documento" DROP CONSTRAINT "projeto_documento_removido_por_fkey";

-- DropIndex
DROP INDEX "meta_orcamento_versao_anterior_id_key";

-- AlterTable
ALTER TABLE "meta_orcamento" DROP COLUMN "versao_anterior_id";

-- AlterTable
ALTER TABLE "projeto" ADD COLUMN     "aprovacao_processo_sei" TEXT,
ADD COLUMN     "aprovacao_registro_sei_errmsg" TEXT,
ADD COLUMN     "aprovacao_registro_sei_info" JSONB,
ADD COLUMN     "encerramento_processo_sei" TEXT,
ADD COLUMN     "encerramento_registro_sei_errmsg" TEXT,
ADD COLUMN     "encerramento_registro_sei_info" JSONB,
ADD COLUMN     "orgaos_participantes" INTEGER[] DEFAULT ARRAY[]::INTEGER[];

-- AlterTable
ALTER TABLE "projeto_documento" DROP COLUMN "arquivo_id",
DROP COLUMN "atualizado_em",
DROP COLUMN "atualizado_por",
DROP COLUMN "criado_em",
DROP COLUMN "criado_por",
DROP COLUMN "removido_em",
DROP COLUMN "removido_por",
ADD COLUMN     "documento_id" INTEGER NOT NULL;

-- DropTable
DROP TABLE "ProjetoRegistroSei";

-- DropTable
DROP TABLE "projeto_orgao_participante";

-- DropEnum
DROP TYPE "CategoriaProcessoSei";

-- AddForeignKey
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

