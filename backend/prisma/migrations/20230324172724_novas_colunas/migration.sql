-- AlterTable
ALTER TABLE "indicador" ALTER COLUMN "acumulado_valor_base" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "plano_acao" ADD COLUMN     "contato_do_responsavel" TEXT,
ADD COLUMN     "data_termino" DATE;

-- AlterTable
ALTER TABLE "projeto_risco" ADD COLUMN     "titulo" TEXT NOT NULL DEFAULT '(sem título)';

-- AlterTable
ALTER TABLE "tarefa" ADD COLUMN     "eh_marco" BOOLEAN NOT NULL DEFAULT false;
