/*
  Warnings:

  - A unique constraint covering the columns `[pessoa_id,variavel_id]` on the table `variavel_responsavel` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "TransferenciaInterface" AS ENUM ('TransfereGov', 'SemPapel');

-- CreateTable
CREATE TABLE "Transferencia" (
    "id" SERIAL NOT NULL,
    "tipo_id" INTEGER NOT NULL,
    "orgao_concedente_id" INTEGER NOT NULL,
    "secretaria_concedente_id" INTEGER NOT NULL,
    "parlamentar_id" INTEGER,
    "partido_id" INTEGER,
    "objeto" TEXT NOT NULL,
    "critico" BOOLEAN NOT NULL,
    "interface" "TransferenciaInterface" NOT NULL,
    "identificador" TEXT NOT NULL,
    "esfera" "TransferenciaTipoEsfera" NOT NULL,
    "clausula_suspensiva" BOOLEAN NOT NULL,
    "clausula_suspensiva_vencimento" DATE,
    "empenho" BOOLEAN,
    "pendente_preenchimento_valores" BOOLEAN NOT NULL DEFAULT true,
    "valor" DECIMAL(15,2) DEFAULT 0,
    "valor_total" DECIMAL(15,2) DEFAULT 0,
    "valor_contrapartida" DECIMAL(15,2) DEFAULT 0,
    "ano" INTEGER,
    "emenda" TEXT,
    "dotacao" TEXT,
    "demanda" TEXT,
    "programa" TEXT,
    "banco_fim" TEXT,
    "normativa" TEXT,
    "conta_fim" TEXT,
    "agencia_fim" TEXT,
    "observacoes" TEXT,
    "detalhamento" TEXT,
    "banco_aceite" TEXT,
    "conta_aceite" TEXT,
    "nome_programa" TEXT,
    "agencia_aceite" TEXT,
    "emenda_unitaria" TEXT,
    "gestor_contrato" TEXT,
    "ordenador_despesa" TEXT,
    "numero_identificacao" TEXT,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "Transferencia_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "transferencia_tipo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_orgao_concedente_id_fkey" FOREIGN KEY ("orgao_concedente_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_secretaria_concedente_id_fkey" FOREIGN KEY ("secretaria_concedente_id") REFERENCES "orgao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_parlamentar_id_fkey" FOREIGN KEY ("parlamentar_id") REFERENCES "parlamentar"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_partido_id_fkey" FOREIGN KEY ("partido_id") REFERENCES "partido"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transferencia" ADD CONSTRAINT "Transferencia_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
