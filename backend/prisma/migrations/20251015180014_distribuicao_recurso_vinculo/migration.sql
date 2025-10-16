/*
  Warnings:

  - You are about to drop the `TipoVinculo` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "CampoVinculo" AS ENUM ('Endereco', 'Dotacao');

-- DropForeignKey
ALTER TABLE "TipoVinculo" DROP CONSTRAINT "TipoVinculo_atualizado_por_fkey";

-- DropForeignKey
ALTER TABLE "TipoVinculo" DROP CONSTRAINT "TipoVinculo_criado_por_fkey";

-- DropForeignKey
ALTER TABLE "TipoVinculo" DROP CONSTRAINT "TipoVinculo_removido_por_fkey";

-- DropTable
DROP TABLE "TipoVinculo";

-- CreateTable
CREATE TABLE "tipo_vinculo" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "tipo_vinculo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "distribuicao_recurso_vinculo" (
    "id" SERIAL NOT NULL,
    "distribuicao_id" INTEGER NOT NULL,
    "tipo_vinculo_id" INTEGER NOT NULL,
    "projeto_id" INTEGER,
    "meta_id" INTEGER,
    "observacao" TEXT,
    "campo_vinculo" "CampoVinculo" NOT NULL,
    "valor_vinculo" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "invalidado_em" TIMESTAMPTZ(6),
    "motivo_invalido" TEXT,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "distribuicao_recurso_vinculo_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tipo_vinculo" ADD CONSTRAINT "tipo_vinculo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_vinculo" ADD CONSTRAINT "tipo_vinculo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tipo_vinculo" ADD CONSTRAINT "tipo_vinculo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_distribuicao_id_fkey" FOREIGN KEY ("distribuicao_id") REFERENCES "distribuicao_recurso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_tipo_vinculo_id_fkey" FOREIGN KEY ("tipo_vinculo_id") REFERENCES "tipo_vinculo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_projeto_id_fkey" FOREIGN KEY ("projeto_id") REFERENCES "projeto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_meta_id_fkey" FOREIGN KEY ("meta_id") REFERENCES "meta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_vinculo" ADD CONSTRAINT "distribuicao_recurso_vinculo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
