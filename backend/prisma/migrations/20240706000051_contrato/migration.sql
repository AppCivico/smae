-- CreateEnum
CREATE TYPE "StatusContrato" AS ENUM ('Assinado', 'Vigente', 'Suspenso', 'Rescindido', 'ConcluidoTermoRecebimentoProvisorio', 'ConcluidoTermoRecebimentoDefinitivo');

-- CreateEnum
CREATE TYPE "ContratoPrazoUnidade" AS ENUM ('Dias', 'Meses');

-- CreateTable
CREATE TABLE "contrato" (
    "id" SERIAL NOT NULL,
    "projeto_id" INTEGER NOT NULL,
    "modalidade_contratacao_id" INTEGER,
    "orgao_id" INTEGER,
    "numero" TEXT NOT NULL,
    "contrato_exclusivo" BOOLEAN NOT NULL,
    "status" "StatusContrato" NOT NULL,
    "objeto_resumo" TEXT,
    "objeto_detalhado" TEXT,
    "contratante" TEXT,
    "empresa_contratada" TEXT,
    "cnpj_contratada" TEXT,
    "observacoes" TEXT,
    "data_assinatura" DATE,
    "data_inicio" DATE,
    "prazo_numero" INTEGER,
    "prazo_unidade" "ContratoPrazoUnidade",
    "data_base_mes" INTEGER,
    "data_base_ano" INTEGER,
    "valor" DECIMAL(15,2),
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "contrato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contrato_sei" (
    "id" SERIAL NOT NULL,
    "contrato_id" INTEGER NOT NULL,
    "numero_sei" TEXT NOT NULL,

    CONSTRAINT "contrato_sei_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContratoFonteRecurso" (
    "contrato_id" INTEGER NOT NULL,
    "projeto_fonte_recurso_id" INTEGER NOT NULL,

    CONSTRAINT "ContratoFonteRecurso_pkey" PRIMARY KEY ("contrato_id","projeto_fonte_recurso_id")
);

-- CreateTable
CREATE TABLE "contrato_aditivo" (
    "id" SERIAL NOT NULL,
    "contrato_id" INTEGER NOT NULL,
    "tipo_aditivo_id" INTEGER NOT NULL,
    "numero" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "data_termino_atualizada" DATE,
    "valor" DECIMAL(15,2) NOT NULL,
    "percentual_medido" DECIMAL(7,4) NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "contrato_aditivo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_modalidade_contratacao_id_fkey" FOREIGN KEY ("modalidade_contratacao_id") REFERENCES "modalidade_contratacao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_orgao_id_fkey" FOREIGN KEY ("orgao_id") REFERENCES "orgao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato" ADD CONSTRAINT "contrato_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_sei" ADD CONSTRAINT "contrato_sei_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoFonteRecurso" ADD CONSTRAINT "ContratoFonteRecurso_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContratoFonteRecurso" ADD CONSTRAINT "ContratoFonteRecurso_projeto_fonte_recurso_id_fkey" FOREIGN KEY ("projeto_fonte_recurso_id") REFERENCES "projeto_fonte_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_aditivo" ADD CONSTRAINT "contrato_aditivo_contrato_id_fkey" FOREIGN KEY ("contrato_id") REFERENCES "contrato"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_aditivo" ADD CONSTRAINT "contrato_aditivo_tipo_aditivo_id_fkey" FOREIGN KEY ("tipo_aditivo_id") REFERENCES "tipo_aditivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_aditivo" ADD CONSTRAINT "contrato_aditivo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_aditivo" ADD CONSTRAINT "contrato_aditivo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contrato_aditivo" ADD CONSTRAINT "contrato_aditivo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
