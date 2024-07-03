-- CreateTable
CREATE TABLE "variavel_assunto_variavel" (
    "id" SERIAL NOT NULL,
    "variavel_id" INTEGER NOT NULL,
    "assunto_variavel_id" INTEGER NOT NULL,

    CONSTRAINT "variavel_assunto_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assunto_variavel" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6),
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "assunto_variavel_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "variavel_assunto_variavel_variavel_id_idx" ON "variavel_assunto_variavel"("variavel_id");

-- CreateIndex
CREATE INDEX "variavel_assunto_variavel_assunto_variavel_id_idx" ON "variavel_assunto_variavel"("assunto_variavel_id");

-- AddForeignKey
ALTER TABLE "variavel_assunto_variavel" ADD CONSTRAINT "variavel_assunto_variavel_variavel_id_fkey" FOREIGN KEY ("variavel_id") REFERENCES "variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variavel_assunto_variavel" ADD CONSTRAINT "variavel_assunto_variavel_assunto_variavel_id_fkey" FOREIGN KEY ("assunto_variavel_id") REFERENCES "assunto_variavel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assunto_variavel" ADD CONSTRAINT "assunto_variavel_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assunto_variavel" ADD CONSTRAINT "assunto_variavel_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assunto_variavel" ADD CONSTRAINT "assunto_variavel_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "distribuicao_recurso_status" ADD CONSTRAINT "distribuicao_recurso_status_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
