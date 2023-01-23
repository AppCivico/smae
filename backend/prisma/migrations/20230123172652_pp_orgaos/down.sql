-- AlterEnum
BEGIN;
CREATE TYPE "ProjetoStatus_new" AS ENUM ('Registrado', 'Priorizado', 'EmPlanejamento', 'Validado', 'EmAcompanhamento', 'Fechado', 'Suspenso');
ALTER TABLE "projeto" ALTER COLUMN "status" TYPE "ProjetoStatus_new" USING ("status"::text::"ProjetoStatus_new");
ALTER TYPE "ProjetoStatus" RENAME TO "ProjetoStatus_old";
ALTER TYPE "ProjetoStatus_new" RENAME TO "ProjetoStatus";
DROP TYPE "ProjetoStatus_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "portifolio_orgao" DROP CONSTRAINT "portifolio_orgao_portifolio_id_fkey";

-- DropForeignKey
ALTER TABLE "portifolio_orgao" DROP CONSTRAINT "portifolio_orgao_orgao_id_fkey";

-- DropForeignKey
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_portifolio_id_fkey";

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

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "em_planejamento_em",
DROP COLUMN "em_planejamento_por",
DROP COLUMN "orgao_gestor_id",
DROP COLUMN "orgao_responsavel_id",
DROP COLUMN "orgaos_participantes",
DROP COLUMN "portifolio_id",
DROP COLUMN "registrado_em",
DROP COLUMN "registrado_por",
DROP COLUMN "responsaveis_no_orgao_gestor",
DROP COLUMN "responsavel_id",
DROP COLUMN "selecionado_em",
DROP COLUMN "selecionado_por",
ADD COLUMN     "aprovado_em" TIMESTAMP(3),
ADD COLUMN     "aprovado_por" INTEGER,
ADD COLUMN     "diretorio_id" INTEGER NOT NULL,
ADD COLUMN     "priorizado_em" TIMESTAMP(3),
ADD COLUMN     "priorizado_por" INTEGER,
ADD COLUMN     "responsavel" TEXT;

-- DropTable
DROP TABLE "portifolio";

-- DropTable
DROP TABLE "portifolio_orgao";

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
ALTER TABLE "projeto_orgao" ADD CONSTRAINT "projeto_orgao_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_orgao" ADD CONSTRAINT "projeto_orgao_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

