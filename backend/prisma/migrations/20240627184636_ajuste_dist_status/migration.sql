/*
  Warnings:

  - You are about to drop the `transferencia_tipo_distribuicao_status` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "distribuicao_recurso_status" DROP CONSTRAINT "distribuicao_recurso_status_status_id_fkey";

-- DropForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" DROP CONSTRAINT "transferencia_tipo_distribuicao_status_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" DROP CONSTRAINT "transferencia_tipo_distribuicao_status_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" DROP CONSTRAINT "transferencia_tipo_distribuicao_status_removido_por_fkey";

-- DropForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" DROP CONSTRAINT "transferencia_tipo_distribuicao_status_transferencia_tipo__fkey";

-- DropForeignKey
ALTER TABLE "workflow_distribuicao_status" DROP CONSTRAINT "workflow_distribuicao_status_status_id_fkey";

-- DropTable
DROP TABLE "transferencia_tipo_distribuicao_status";

-- CreateTable
CREATE TABLE "distribuicao_status" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "DistribuicaoStatusTipo" NOT NULL,
    "valor_distribuicao_contabilizado" BOOLEAN NOT NULL,
    "permite_novos_registros" BOOLEAN NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),
    "transferenciaTipoId" INTEGER,

    CONSTRAINT "distribuicao_status_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "distribuicao_status" ADD CONSTRAINT "distribuicao_status_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_status" ADD CONSTRAINT "distribuicao_status_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_status" ADD CONSTRAINT "distribuicao_status_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_status" ADD CONSTRAINT "distribuicao_status_transferenciaTipoId_fkey" FOREIGN KEY ("transferenciaTipoId") REFERENCES "transferencia_tipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workflow_distribuicao_status" ADD CONSTRAINT "workflow_distribuicao_status_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "distribuicao_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "distribuicao_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;
