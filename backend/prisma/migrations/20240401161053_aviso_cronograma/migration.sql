-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "task_type" ADD VALUE 'aviso_email';
ALTER TYPE "task_type" ADD VALUE 'aviso_email_cronograma_tp';

-- AlterTable
ALTER TABLE "aviso_email" ADD COLUMN     "executou_em" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "executou_em_ts" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "ultimo_envio_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "cronograma_termino_planejado_config" (
    "id" SERIAL NOT NULL,
    "modulo_sistema" "ModuloSistema" NOT NULL,
    "para" TEXT NOT NULL,
    "texto_inicial" TEXT NOT NULL,
    "texto_final" TEXT NOT NULL,
    "assunto_global" TEXT NOT NULL,
    "assunto_orgao" TEXT NOT NULL,

    CONSTRAINT "cronograma_termino_planejado_config_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cronograma_termino_planejado_config_modulo_sistema_key" ON "cronograma_termino_planejado_config"("modulo_sistema");
