-- AlterEnum
ALTER TYPE "task_type" ADD VALUE 'run_report';

-- DropForeignKey
ALTER TABLE "projeto_relatorio_fila" DROP CONSTRAINT "projeto_relatorio_fila_relatorio_id_fkey";

-- AlterTable
ALTER TABLE "relatorio" ADD COLUMN     "err_msg" TEXT,
ADD COLUMN     "iniciado_em" TIMESTAMPTZ(6);
