-- CreateEnum
CREATE TYPE "DistribuicaoStatusTipo" AS ENUM ('Registrada', 'Declinada', 'Redirecionada', 'Cancelada', 'ImpedidaTecnicamente', 'Finalizada');

-- CreateTable
CREATE TABLE "distribuicao_status_base" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "DistribuicaoStatusTipo" NOT NULL,
    "valor_distribuicao_contabilizado" BOOLEAN NOT NULL,

    CONSTRAINT "distribuicao_status_base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transferencia_tipo_distribuicao_status" (
    "id" SERIAL NOT NULL,
    "transferencia_tipo_id" INTEGER NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" "DistribuicaoStatusTipo" NOT NULL,
    "valor_distribuicao_contabilizado" BOOLEAN NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "transferencia_tipo_distribuicao_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "distribuicao_status_base_nome_tipo_key" ON "distribuicao_status_base"("nome", "tipo");

-- AddForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" ADD CONSTRAINT "transferencia_tipo_distribuicao_status_transferencia_tipo__fkey" FOREIGN KEY ("transferencia_tipo_id") REFERENCES "transferencia_tipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" ADD CONSTRAINT "transferencia_tipo_distribuicao_status_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" ADD CONSTRAINT "transferencia_tipo_distribuicao_status_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_tipo_distribuicao_status" ADD CONSTRAINT "transferencia_tipo_distribuicao_status_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
