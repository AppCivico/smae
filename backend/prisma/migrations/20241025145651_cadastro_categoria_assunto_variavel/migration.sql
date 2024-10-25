-- AlterTable
ALTER TABLE "assunto_variavel" ADD COLUMN     "categoria_assunto_variavel_id" INTEGER;

-- CreateTable
CREATE TABLE "categoria_assunto_variavel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "categoria_assunto_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categoria_assunto_variavel_nome_idx" ON "categoria_assunto_variavel"("nome");

-- AddForeignKey
ALTER TABLE "assunto_variavel" ADD CONSTRAINT "assunto_variavel_categoria_assunto_variavel_id_fkey" FOREIGN KEY ("categoria_assunto_variavel_id") REFERENCES "categoria_assunto_variavel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_assunto_variavel" ADD CONSTRAINT "categoria_assunto_variavel_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_assunto_variavel" ADD CONSTRAINT "categoria_assunto_variavel_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categoria_assunto_variavel" ADD CONSTRAINT "categoria_assunto_variavel_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
