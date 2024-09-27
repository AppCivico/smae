-- CreateEnum
CREATE TYPE "TransferenciaHistoricoAcao" AS ENUM ('TrocaTipo', 'DelecaoWorkflow');

-- CreateTable
CREATE TABLE "transferencia_historico" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "tipo_antigo_id" INTEGER,
    "tipo_novo_id" INTEGER,
    "acao" "TransferenciaHistoricoAcao" NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transferencia_historico_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "transferencia_historico" ADD CONSTRAINT "transferencia_historico_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_historico" ADD CONSTRAINT "transferencia_historico_tipo_antigo_id_fkey" FOREIGN KEY ("tipo_antigo_id") REFERENCES "transferencia_tipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_historico" ADD CONSTRAINT "transferencia_historico_tipo_novo_id_fkey" FOREIGN KEY ("tipo_novo_id") REFERENCES "transferencia_tipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_historico" ADD CONSTRAINT "transferencia_historico_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
