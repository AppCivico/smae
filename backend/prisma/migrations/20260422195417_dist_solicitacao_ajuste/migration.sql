-- CreateEnum
CREATE TYPE "DistribuicaoSolicitacaoStatus" AS ENUM ('Pendente', 'Aprovada', 'Recusada');

-- CreateTable
CREATE TABLE "distribuicao_recurso_solicitacao_ajuste" (
    "id" SERIAL NOT NULL,
    "distribuicao_recurso_id" INTEGER NOT NULL,
    "orgao_gestor_id" INTEGER NOT NULL,
    "status" "DistribuicaoSolicitacaoStatus" NOT NULL DEFAULT 'Pendente',
    "campos_solicitados" JSONB NOT NULL,
    "resposta_motivo" TEXT,
    "respondido_por" INTEGER,
    "respondido_em" TIMESTAMPTZ(6),
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "distribuicao_recurso_solicitacao_ajuste_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_solicitacao_ajuste" ADD CONSTRAINT "distribuicao_recurso_solicitacao_ajuste_distribuicao_recur_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_solicitacao_ajuste" ADD CONSTRAINT "distribuicao_recurso_solicitacao_ajuste_orgao_gestor_id_fkey" FOREIGN KEY ("orgao_gestor_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_solicitacao_ajuste" ADD CONSTRAINT "distribuicao_recurso_solicitacao_ajuste_respondido_por_fkey" FOREIGN KEY ("respondido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_solicitacao_ajuste" ADD CONSTRAINT "distribuicao_recurso_solicitacao_ajuste_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_solicitacao_ajuste" ADD CONSTRAINT "distribuicao_recurso_solicitacao_ajuste_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_solicitacao_ajuste" ADD CONSTRAINT "distribuicao_recurso_solicitacao_ajuste_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Partial unique index: only one pending solicitation per distribuicao_recurso
CREATE UNIQUE INDEX "distribuicao_recurso_solicitacao_ajuste_pendente_unq"
    ON "distribuicao_recurso_solicitacao_ajuste" ("distribuicao_recurso_id")
    WHERE status = 'Pendente' AND removido_em IS NULL;
