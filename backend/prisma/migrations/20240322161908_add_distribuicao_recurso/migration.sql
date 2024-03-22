-- CreateTable
CREATE TABLE "distribuicao_recurso" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "orgao_gestor_id" INTEGER NOT NULL,
    "objeto" TEXT NOT NULL,
    "valor" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valor_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "valor_contrapartida" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "empenho" BOOLEAN NOT NULL,
    "programa_orcamentario_estadual" TEXT,
    "programa_orcamentario_municipal" TEXT,
    "dotacao" TEXT,
    "proposta" TEXT,
    "contrato" TEXT,
    "convenio" TEXT,
    "assinatura_termo_aceite" DATE,
    "assinatura_municipio" DATE,
    "assinatura_estado" DATE,
    "vigencia" DATE,
    "conclusao_suspensiva" DATE,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "distribuicao_recurso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribuicao_recurso_sei" (
    "id" SERIAL NOT NULL,
    "distribuicao_recurso_id" INTEGER NOT NULL,
    "processo_sei" TEXT NOT NULL,
    "registro_sei_info" JSONB NOT NULL DEFAULT '{}',
    "registro_sei_errmsg" TEXT,
    "criado_em" TIMESTAMP(3),
    "criado_por" INTEGER,
    "atualizado_em" TIMESTAMP(3),
    "atualizado_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "distribuicao_recurso_sei_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "distribuicao_recurso" ADD CONSTRAINT "distribuicao_recurso_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso" ADD CONSTRAINT "distribuicao_recurso_orgao_gestor_id_fkey" FOREIGN KEY ("orgao_gestor_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso" ADD CONSTRAINT "distribuicao_recurso_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso" ADD CONSTRAINT "distribuicao_recurso_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso" ADD CONSTRAINT "distribuicao_recurso_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_sei" ADD CONSTRAINT "distribuicao_recurso_sei_distribuicao_recurso_id_fkey" FOREIGN KEY ("distribuicao_recurso_id") REFERENCES "distribuicao_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_sei" ADD CONSTRAINT "distribuicao_recurso_sei_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_sei" ADD CONSTRAINT "distribuicao_recurso_sei_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_sei" ADD CONSTRAINT "distribuicao_recurso_sei_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
