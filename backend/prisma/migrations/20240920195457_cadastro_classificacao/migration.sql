-- CreateTable
CREATE TABLE "classificacao" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "tipoTransferencia" INTEGER,
    "criado_por" INTEGER NOT NULL,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "classificacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ClassificacaoToTransferenciaTipo" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "classificacao_nome_idx" ON "classificacao"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "_ClassificacaoToTransferenciaTipo_AB_unique" ON "_ClassificacaoToTransferenciaTipo"("A", "B");

-- CreateIndex
CREATE INDEX "_ClassificacaoToTransferenciaTipo_B_index" ON "_ClassificacaoToTransferenciaTipo"("B");

-- AddForeignKey
ALTER TABLE "classificacao" ADD CONSTRAINT "classificacao_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacao" ADD CONSTRAINT "classificacao_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacao" ADD CONSTRAINT "classificacao_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classificacao" ADD CONSTRAINT "classificacao_tipoTransferencia_fkey" FOREIGN KEY ("tipoTransferencia") REFERENCES "transferencia_tipo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassificacaoToTransferenciaTipo" ADD CONSTRAINT "_ClassificacaoToTransferenciaTipo_A_fkey" FOREIGN KEY ("A") REFERENCES "classificacao"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClassificacaoToTransferenciaTipo" ADD CONSTRAINT "_ClassificacaoToTransferenciaTipo_B_fkey" FOREIGN KEY ("B") REFERENCES "transferencia_tipo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
