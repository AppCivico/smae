/*
  Warnings:

  - You are about to drop the column `peso` on the `variavel` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "variavel" DROP COLUMN "peso",
ADD COLUMN     "atraso_meses" INTEGER NOT NULL DEFAULT 1;

-- CreateTable
CREATE TABLE "variavel_ciclo_fisico_qualitativo" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "diretamente_do_indicador_da_meta" BOOLEAN NOT NULL,
    "referencia_data" DATE NOT NULL,
    "analise_qualitativa" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "variavel_ciclo_fisico_qualitativo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variavel_ciclo_fisico_pedido_complementacao" (
    "id" SERIAL NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "pedido" TEXT NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "ultima_revisao" BOOLEAN NOT NULL,
    "atendido" BOOLEAN NOT NULL,
    "atendido_em" TIMESTAMP(3),
    "atendido_por" INTEGER,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "variavel_ciclo_fisico_pedido_complementacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variavel_ciclo_fisico_documento" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "diretamente_do_indicador_da_meta" BOOLEAN NOT NULL,
    "referencia_data" DATE NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criado_por" INTEGER NOT NULL,
    "removido_em" TIMESTAMP(3),
    "removido_por" INTEGER,

    CONSTRAINT "variavel_ciclo_fisico_documento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_variavel_ciclo_fisico" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "aguarda_cp" BOOLEAN NOT NULL DEFAULT false,
    "aguarda_complementacao" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "status_variavel_ciclo_fisico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "status_meta_ciclo_fisico" (
    "id" SERIAL NOT NULL,
    "meta_id" INTEGER NOT NULL,
    "ciclo_fisico_id" INTEGER NOT NULL,
    "status" TEXT NOT NULL,

    CONSTRAINT "status_meta_ciclo_fisico_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variavel_ciclo_fisico_qualitativo_meta_id_ultima_revisao_idx" ON "variavel_ciclo_fisico_qualitativo"("meta_id", "ultima_revisao");

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_qualitativo" ADD CONSTRAINT "variavel_ciclo_fisico_qualitativo_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_qualitativo" ADD CONSTRAINT "variavel_ciclo_fisico_qualitativo_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_qualitativo" ADD CONSTRAINT "variavel_ciclo_fisico_qualitativo_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_qualitativo" ADD CONSTRAINT "variavel_ciclo_fisico_qualitativo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_qualitativo" ADD CONSTRAINT "variavel_ciclo_fisico_qualitativo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_pedido_complementacao" ADD CONSTRAINT "variavel_ciclo_fisico_pedido_complementacao_ciclo_fisico_i_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_pedido_complementacao" ADD CONSTRAINT "variavel_ciclo_fisico_pedido_complementacao_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_pedido_complementacao" ADD CONSTRAINT "variavel_ciclo_fisico_pedido_complementacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_pedido_complementacao" ADD CONSTRAINT "variavel_ciclo_fisico_pedido_complementacao_atendido_por_fkey" FOREIGN KEY ("atendido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_pedido_complementacao" ADD CONSTRAINT "variavel_ciclo_fisico_pedido_complementacao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_documento" ADD CONSTRAINT "variavel_ciclo_fisico_documento_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_documento" ADD CONSTRAINT "variavel_ciclo_fisico_documento_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_documento" ADD CONSTRAINT "variavel_ciclo_fisico_documento_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_documento" ADD CONSTRAINT "variavel_ciclo_fisico_documento_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_documento" ADD CONSTRAINT "variavel_ciclo_fisico_documento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_ciclo_fisico_documento" ADD CONSTRAINT "variavel_ciclo_fisico_documento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_variavel_ciclo_fisico" ADD CONSTRAINT "status_variavel_ciclo_fisico_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_variavel_ciclo_fisico" ADD CONSTRAINT "status_variavel_ciclo_fisico_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_variavel_ciclo_fisico" ADD CONSTRAINT "status_variavel_ciclo_fisico_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_meta_ciclo_fisico" ADD CONSTRAINT "status_meta_ciclo_fisico_ciclo_fisico_id_fkey" FOREIGN KEY ("ciclo_fisico_id") REFERENCES "ciclo_fisico"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "status_meta_ciclo_fisico" ADD CONSTRAINT "status_meta_ciclo_fisico_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
