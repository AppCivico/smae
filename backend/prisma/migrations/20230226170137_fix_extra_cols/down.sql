-- DropForeignKey
ALTER TABLE "projeto_registro_sei" DROP CONSTRAINT "projeto_registro_sei_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "tarefa" DROP CONSTRAINT "tarefa_projeto_id_fkey";

-- DropForeignKey
ALTER TABLE "tarefa" DROP CONSTRAINT "tarefa_tarefa_pai_id_fkey";

-- DropForeignKey
ALTER TABLE "tarefa" DROP CONSTRAINT "tarefa_orgao_id_fkey";

-- DropForeignKey
ALTER TABLE "tarefa_dependente" DROP CONSTRAINT "tarefa_dependente_tarefa_id_fkey";

-- DropForeignKey
ALTER TABLE "tarefa_dependente" DROP CONSTRAINT "tarefa_dependente_dependencia_tarefa_id_fkey";

-- DropForeignKey
ALTER TABLE "risco_tarefa" DROP CONSTRAINT "risco_tarefa_tarefa_id_fkey";

-- AlterTable
ALTER TABLE "portfolio" DROP COLUMN "nivel_maximo_tarefa";

-- AlterTable
ALTER TABLE "projeto" DROP COLUMN "tarefa_lock_seq";

-- DropTable
DROP TABLE "projeto_registro_sei";

-- DropTable
DROP TABLE "tarefa";

-- DropTable
DROP TABLE "tarefa_dependente";

-- DropEnum
DROP TYPE "TarefaDependenteTipo";

-- CreateTable
CREATE TABLE "ProjetoRegistroSei" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "categoria" "CategoriaProcessoSei" NOT NULL,
    "processo_sei" TEXT NOT NULL,
    "registro_sei_info" JSONB NOT NULL,
    "registro_sei_errmsg" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL,
    "criado_por" INTEGER NOT NULL,

    CONSTRAINT "ProjetoRegistroSei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarefa" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "orgao_id" INTEGER NOT NULL,
    "tarefa_pai_id" INTEGER,
    "numero" INTEGER NOT NULL,
    "nivel" SMALLINT NOT NULL,
    "inicio_planejado" TIMESTAMP(3),
    "termino_planejado" TIMESTAMP(3),
    "duracao_planejado" INTEGER,
    "inicio_real" TIMESTAMP(3),
    "termino_real" TIMESTAMP(3),
    "duracao_real" INTEGER,
    "custo_estimado" DOUBLE PRECISION,
    "custo_real" DOUBLE PRECISION,
    "percentual_concluido" DOUBLE PRECISION,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "Tarefa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefa_predecessora" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "tarefa_predecessora_id" INTEGER NOT NULL,

    CONSTRAINT "tarefa_predecessora_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tarefa_recurso" (
    "id" SERIAL NOT NULL,
    "tarefa_id" INTEGER NOT NULL,
    "recurso" TEXT NOT NULL,

    CONSTRAINT "tarefa_recurso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjetoRegistroSei" ADD CONSTRAINT "ProjetoRegistroSei_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarefa" ADD CONSTRAINT "Tarefa_tarefa_pai_id_fkey" FOREIGN KEY ("tarefa_pai_id") REFERENCES "Tarefa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risco_tarefa" ADD CONSTRAINT "risco_tarefa_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_predecessora" ADD CONSTRAINT "tarefa_predecessora_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_predecessora" ADD CONSTRAINT "tarefa_predecessora_tarefa_predecessora_id_fkey" FOREIGN KEY ("tarefa_predecessora_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tarefa_recurso" ADD CONSTRAINT "tarefa_recurso_tarefa_id_fkey" FOREIGN KEY ("tarefa_id") REFERENCES "Tarefa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

