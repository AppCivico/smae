-- CreateTable
CREATE TABLE "projeto_tipo_encerramento" (
    "id" SERIAL NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo"  "TipoProjeto" NOT NULL DEFAULT 'PP',
    "criado_por" INTEGER,
    "criado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_por" INTEGER,
    "atualizado_em" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removido_por" INTEGER,
    "removido_em" TIMESTAMPTZ(6),

    CONSTRAINT "projeto_tipo_encerramento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "projeto_tipo_encerramento" ADD CONSTRAINT "projeto_tipo_encerramento_atualizado_por_fkey" FOREIGN KEY ("atualizado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_tipo_encerramento" ADD CONSTRAINT "projeto_tipo_encerramento_criado_por_fkey" FOREIGN KEY ("criado_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projeto_tipo_encerramento" ADD CONSTRAINT "projeto_tipo_encerramento_removido_por_fkey" FOREIGN KEY ("removido_por") REFERENCES "pessoa"("id") ON DELETE SET NULL ON UPDATE CASCADE;
