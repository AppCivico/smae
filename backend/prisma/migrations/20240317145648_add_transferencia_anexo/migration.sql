-- CreateTable
CREATE TABLE "transferencia_anexo" (
    "id" SERIAL NOT NULL,
    "transferencia_id" INTEGER NOT NULL,
    "arquivo_id" INTEGER NOT NULL,
    "descricao" TEXT,
    "data" TIMESTAMP(3),
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "transferencia_anexo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "transferencia_anexo_transferencia_id_idx" ON "transferencia_anexo"("transferencia_id");

-- AddForeignKey
ALTER TABLE "transferencia_anexo" ADD CONSTRAINT "transferencia_anexo_transferencia_id_fkey" FOREIGN KEY ("transferencia_id") REFERENCES "Transferencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_anexo" ADD CONSTRAINT "transferencia_anexo_arquivo_id_fkey" FOREIGN KEY ("arquivo_id") REFERENCES "arquivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_anexo" ADD CONSTRAINT "transferencia_anexo_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_anexo" ADD CONSTRAINT "transferencia_anexo_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transferencia_anexo" ADD CONSTRAINT "transferencia_anexo_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
