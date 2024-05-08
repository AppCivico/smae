-- CreateEnum
CREATE TYPE "TipoVariavelCategorica" AS ENUM ('Binaria', 'Cronograma', 'Qualitativa');

-- AlterTable
ALTER TABLE "serie_variavel" ADD COLUMN     "variavel_categorica_id" INTEGER,
ADD COLUMN     "variavel_categorica_valor_id" INTEGER;

-- AlterTable
ALTER TABLE "variavel" ADD COLUMN     "variavel_categorica_id" INTEGER;

-- CreateTable
CREATE TABLE "variavel_categorica" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoVariavelCategorica" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "variavel_categorica_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variavel_categorica_valor" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "valor_variavel" INTEGER NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "variavel_categorica_id" INTEGER NOT NULL,
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "variavel_categorica_valor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variavel_categorica_titulo_idx" ON "variavel_categorica"("titulo");

-- CreateIndex
CREATE UNIQUE INDEX "variavel_categorica_valor_variavel_categorica_id_valor_vari_key" ON "variavel_categorica_valor"("variavel_categorica_id", "valor_variavel");

-- CreateIndex
CREATE UNIQUE INDEX "variavel_categorica_valor_variavel_categorica_id_id_key" ON "variavel_categorica_valor"("variavel_categorica_id", "id");

-- AddForeignKey
ALTER TABLE "variavel" ADD CONSTRAINT "variavel_variavel_categorica_id_fkey" FOREIGN KEY ("variavel_categorica_id") REFERENCES "variavel_categorica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_categorica" ADD CONSTRAINT "variavel_categorica_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_categorica" ADD CONSTRAINT "variavel_categorica_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_categorica" ADD CONSTRAINT "variavel_categorica_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_categorica_valor" ADD CONSTRAINT "variavel_categorica_valor_variavel_categorica_id_fkey" FOREIGN KEY ("variavel_categorica_id") REFERENCES "variavel_categorica"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_categorica_valor" ADD CONSTRAINT "variavel_categorica_valor_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_categorica_valor" ADD CONSTRAINT "variavel_categorica_valor_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_categorica_valor" ADD CONSTRAINT "variavel_categorica_valor_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_variavel" ADD CONSTRAINT "serie_variavel_variavel_categorica_id_fkey" FOREIGN KEY ("variavel_categorica_id") REFERENCES "variavel_categorica"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "serie_variavel" ADD CONSTRAINT "serie_variavel_variavel_categorica_id_variavel_categorica__fkey" FOREIGN KEY ("variavel_categorica_id", "variavel_categorica_valor_id") REFERENCES "variavel_categorica_valor"("variavel_categorica_id", "id") ON DELETE SET NULL ON UPDATE CASCADE;
