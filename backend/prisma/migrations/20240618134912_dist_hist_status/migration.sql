/*
  Warnings:

  - Added the required column `permite_novos_registros` to the `transferencia_tipo_distribuicao_status` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "distribuicao_status_base" ADD COLUMN     "permite_novos_registros" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "transferencia_tipo_distribuicao_status" ADD COLUMN     "permite_novos_registros" BOOLEAN NOT NULL;

-- CreateTable
CREATE TABLE "distribuicao_recurso_status" (
    "id" SERIAL NOT NULL,
    "distribuicao_id" INTEGER NOT NULL,
    "status_base_id" INTEGER,
    "status_id" INTEGER,
    "orgao_responsavel_id" INTEGER NOT NULL,
    "nome_responsavel" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "data_troca" DATE NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "distribuicao_recurso_status_pkey" PRIMARY KEY ("id"),
    CONSTRAINT  "status_distribuicao_one_fk" CHECK ( status_base_id IS NOT NULL AND status_id IS NULL OR status_base_id IS NULL AND status_id IS NOT NULL )
);

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_distribuicao_id_fkey" FOREIGN KEY ("distribuicao_id") REFERENCES "distribuicao_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_status_base_id_fkey" FOREIGN KEY ("status_base_id") REFERENCES "distribuicao_status_base"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "transferencia_tipo_distribuicao_status"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_orgao_responsavel_id_fkey" FOREIGN KEY ("orgao_responsavel_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
